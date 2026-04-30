"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteTransaction,
  updateTransactionDates,
} from "@/app/dashboard/sales/actions";
import type { TransactionListItem } from "@/lib/sales/queries";

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
          created_at: editCreated ? new Date(editCreated).toISOString() : undefined,
          completed_at: editCompleted ? new Date(editCompleted).toISOString() : null,
        });
        setEditingId(null);
        router.refresh();
      } catch (err) {
        console.error("Failed to update dates:", err);
      }
    });
  }

  function handleDelete(txnId: string) {
    if (!confirm("Are you sure you want to permanently delete this transaction?")) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteTransaction(txnId);
        router.refresh();
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    });
  }

  return (
    <>
      <div className="revenueGrid">
        <div className="revenueCard revenueCard--primary">
          <span className="revenueCard__label">Total Revenue</span>
          <span className="revenueCard__value">
            ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Completed</span>
          <span className="revenueCard__value">{transactions.length}</span>
        </div>
      </div>

      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
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
                  <span className="badge badge--success">
                    Completed
                  </span>
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
      </section>
    </>
  );
}
