"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteTransaction,
  updateTransactionDates,
} from "@/app/dashboard/sales/actions";
import {
  calculateFinalTotal,
  calculateSubtotal,
} from "@/lib/sales/calculations";
import type { TransactionListItem } from "@/lib/sales/queries";
import type { DraftSaleInput } from "@/lib/sales/types";

export function TransactionHistory({
  transactions,
}: {
  transactions: TransactionListItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCreated, setEditCreated] = useState("");
  const [editCompleted, setEditCompleted] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<TransactionListItem | null>(
    null,
  );

  if (transactions.length === 0) {
    return (
      <section className="panel">
        <p className="muted">No completed transactions yet.</p>
      </section>
    );
  }

  const totalRevenue = transactions.reduce(
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
      <div className="revenueGrid">
        <div className="revenueCard revenueCard--primary">
          <span className="revenueCard__label">Total Revenue</span>
          <span className="revenueCard__value">
            ₱
            {totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Completed</span>
          <span className="revenueCard__value">{transactions.length}</span>
        </div>
      </div>

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
                <th>Cashier</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>
                    <strong>{txn.transaction_number}</strong>
                  </td>
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
                            disabled={isPending}
                            type="button"
                            onClick={() => setSelectedTxn(txn)}
                          >
                            View
                          </button>
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

      {renderReceiptModal()}
    </>
  );
}
