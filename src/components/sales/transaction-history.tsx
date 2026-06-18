"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteTransaction,
  getTransactionPayload,
  getTransactionPayloads,
  updateTransactionDates,
} from "@/app/dashboard/sales/actions";
import {
  calculateFinalTotal,
  calculateSubtotal,
} from "@/lib/sales/calculations";
import { exportTransactionsToExcel } from "@/lib/sales/export-excel";
import type { TransactionListItem } from "@/lib/sales/queries";
import type { DraftSaleInput } from "@/lib/sales/types";
import { getDepartmentLabel } from "@/lib/auth/roles";

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultTo(): string {
  return new Date().toISOString().split("T")[0];
}

export function TransactionHistory({
  transactions,
  showDepartment = false,
  isOwner = false,
}: {
  transactions: TransactionListItem[];
  showDepartment?: boolean;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCreated, setEditCreated] = useState("");
  const [editCompleted, setEditCompleted] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<TransactionListItem | null>(
    null,
  );
  const [isLoadingPayload, setIsLoadingPayload] = useState(false);

  // Filter state
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);
  const [filterApplied, setFilterApplied] = useState(true);

  // Apply date filter
  const filteredTransactions = filterApplied
    ? transactions.filter((txn) => {
        const txnDate = new Date(txn.completed_at || txn.created_at);
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        return txnDate >= fromDate && txnDate <= toDate;
      })
    : transactions;

  if (transactions.length === 0) {
    return (
      <section className="panel">
        <p className="muted">No completed transactions yet.</p>
      </section>
    );
  }

  const totalRevenue = filteredTransactions.reduce(
    (sum, t) => sum + Number(t.final_total),
    0,
  );

  function toLocalDatetimeValue(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  function startEdit(txn: TransactionListItem) {
    setEditingId(txn.id);
    setEditCreated(toLocalDatetimeValue(txn.created_at));
    setEditCompleted(toLocalDatetimeValue(txn.completed_at));
  }

  function saveEdit(txnId: string) {
    startTransition(async () => {
      try {
        await updateTransactionDates(txnId, {
          created_at: editCreated
            ? new Date(editCreated).toISOString()
            : undefined,
          completed_at: editCompleted
            ? new Date(editCompleted).toISOString()
            : null,
        });
        setEditingId(null);
        router.refresh();
      } catch (err) {
        console.error("Failed to update dates:", err);
      }
    });
  }

  function handleDelete(txnId: string) {
    if (
      !confirm(
        "Are you sure you want to permanently delete this transaction? This will free up the transaction number for reuse.",
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteTransaction(txnId);
        router.refresh();
      } catch (err) {
        console.error("Failed to delete transaction:", err);
        alert(
          "Failed to delete transaction. It may be locked or you lack permission.",
        );
      }
    });
  }

  function renderReceiptModal() {
    if (!selectedTxn) return null;
    const payload = selectedTxn.draft_payload as DraftSaleInput;
    if (!payload) return null;

    const subtotal = calculateSubtotal(payload);
    const finalTotal = calculateFinalTotal({
      subtotal,
      discount: payload.discount,
      deliveryFee: payload.delivery?.enabled ? payload.delivery.deliveryFee : 0,
    });

    return (
      <div className="modalOverlay" onClick={() => setSelectedTxn(null)}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
          <div className="modalHeader">
            <div>
              <h2>Receipt #{selectedTxn.transaction_number}</h2>
              <p>
                {new Date(
                  selectedTxn.completed_at || selectedTxn.created_at,
                ).toLocaleString()}
              </p>
              <p>Cashier: {selectedTxn.cashier_name}</p>
            </div>
            <button
              className="buttonSmall buttonSmall--ghost"
              onClick={() => setSelectedTxn(null)}
            >
              Close
            </button>
          </div>

          <div className="receiptSection">
            <h3>Items</h3>
            {payload.serviceLines.map((line) => (
              <div key={line.id} style={{ marginBottom: "16px" }}>
                <strong>{line.serviceName}</strong>
                {line.materials.map((mat) => {
                  const matTotal = mat.quantity * mat.unitPrice;
                  return (
                    <div
                      key={mat.id}
                      style={{ paddingLeft: "8px", marginTop: "4px" }}
                    >
                      <div className="receiptRow">
                        <span>
                          {mat.quantity}x {mat.materialName} (₱{mat.unitPrice})
                        </span>
                        <span>₱{matTotal.toFixed(2)}</span>
                      </div>
                      {mat.addOns.map((add) => (
                        <div
                          key={add.id}
                          className="receiptRow"
                          style={{ paddingLeft: "8px", opacity: 0.8 }}
                        >
                          <span>
                            + {add.quantity}x {add.name} (₱{add.unitPrice})
                          </span>
                          <span>
                            ₱{(add.quantity * add.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="receiptSection">
            <div className="receiptRow">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            {payload.discount && (
              <div className="receiptRow">
                <span>
                  Discount (
                  {payload.discount.type === "percentage"
                    ? `${payload.discount.value}%`
                    : `₱${payload.discount.value}`}
                  )
                </span>
                <span>
                  -₱
                  {payload.discount.type === "percentage"
                    ? ((subtotal * payload.discount.value) / 100).toFixed(2)
                    : payload.discount.value.toFixed(2)}
                </span>
              </div>
            )}
            {payload.delivery?.enabled && (
              <div className="receiptRow">
                <span>Delivery Fee</span>
                <span>₱{payload.delivery.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="receiptTotal">
              <span>Total</span>
              <span>₱{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {payload.payment && (
            <div
              className="receiptSection"
              style={{
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div className="receiptRow">
                <span>Payment Method</span>
                <span style={{ textTransform: "capitalize" }}>
                  {payload.payment.method}
                </span>
              </div>
              {payload.payment.method === "cash" && (
                <>
                  <div className="receiptRow">
                    <span>Cash Received</span>
                    <span>₱{payload.payment.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="receiptRow">
                    <span>Change</span>
                    <span>
                      ₱{(payload.payment.cashReceived - finalTotal).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Date filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <label className="salesField">
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="salesField">
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="button"
          type="button"
          onClick={() => setFilterApplied(true)}
        >
          Filter
        </button>
        <button
          className="buttonSecondary"
          type="button"
          onClick={() => {
            setFrom(getDefaultFrom());
            setTo(getDefaultTo());
            setFilterApplied(true);
          }}
        >
          Reset
        </button>
      </div>

      {/* Revenue summary */}
      <div className="revenueGrid">
        <div className="revenueCard revenueCard--primary">
          <span className="revenueCard__label">Total Revenue</span>
          <span className="revenueCard__value">
            ₱
            {totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Transactions</span>
          <span className="revenueCard__value">{filteredTransactions.length}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <button
          className="buttonSmall"
          type="button"
          onClick={async () => {
            setIsLoadingPayload(true);
            try {
              const ids = filteredTransactions.map((t) => t.id);
              const payloads = await getTransactionPayloads(ids);
              const enriched = filteredTransactions.map((t) => ({
                ...t,
                draft_payload: payloads[t.id] ?? null,
              }));
              exportTransactionsToExcel(enriched);
            } catch (err) {
              console.error("Failed to load data for export:", err);
            } finally {
              setIsLoadingPayload(false);
            }
          }}
          disabled={isLoadingPayload}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export to Excel
        </button>
      </div>

      {filteredTransactions.length === 0 ? (
        <section className="panel">
          <p className="muted">No transactions found for the selected date range.</p>
        </section>
      ) : (
        <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              overflowX: "auto",
              width: "100%",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <table className="txnTable">
              <thead>
                <tr>
                  <th>#</th>
                  {showDepartment && <th>Department</th>}
                  <th>Cashier</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>
                      <strong>{txn.transaction_number}</strong>
                    </td>
                    {showDepartment && (
                      <td>
                        <span className="badge">{getDepartmentLabel(txn.department)}</span>
                      </td>
                    )}
                    <td>{txn.cashier_name}</td>
                    <td>
                      <span className="badge badge--success">Completed</span>
                    </td>
                    <td>₱{Number(txn.final_total).toFixed(2)}</td>

                    {editingId === txn.id ? (
                      <>
                        <td>
                          <input
                            className="txnDateInput"
                            type="datetime-local"
                            value={editCreated}
                            onChange={(e) => setEditCreated(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="txnDateInput"
                            type="datetime-local"
                            value={editCompleted}
                            onChange={(e) => setEditCompleted(e.target.value)}
                          />
                        </td>
                        <td>
                          <div className="txnActions">
                            <button
                              className="buttonSmall"
                              disabled={isPending}
                              type="button"
                              onClick={() => saveEdit(txn.id)}
                            >
                              Save
                            </button>
                            <button
                              className="buttonSmall buttonSmall--ghost"
                              disabled={isPending}
                              type="button"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="muted">
                          {new Date(txn.created_at).toLocaleString()}
                        </td>
                        <td className="muted">
                          {txn.completed_at
                            ? new Date(txn.completed_at).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          <div className="txnActions">
                            <button
                              className="buttonSmall"
                              disabled={isPending || isLoadingPayload}
                              type="button"
                              onClick={async () => {
                                setIsLoadingPayload(true);
                                try {
                                  const payload = await getTransactionPayload(txn.id);
                                  setSelectedTxn({ ...txn, draft_payload: payload });
                                } catch (err) {
                                  console.error("Failed to load receipt:", err);
                                } finally {
                                  setIsLoadingPayload(false);
                                }
                              }}
                            >
                              {isLoadingPayload ? "Loading..." : "View"}
                            </button>
                            {isOwner && (
                              <>
                                <button
                                  className="buttonSmall buttonSmall--ghost"
                                  disabled={isPending}
                                  type="button"
                                  onClick={() => startEdit(txn)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="buttonSmall buttonSmall--danger"
                                  disabled={isPending}
                                  type="button"
                                  onClick={() => handleDelete(txn.id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {renderReceiptModal()}
    </>
  );
}
