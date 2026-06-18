"use client";

import { useState } from "react";
import Link from "next/link";

import type { TransactionListItem, DraftTransactionListItem } from "@/lib/sales/queries";
import type { Department } from "@/lib/sales/static-catalog";
import { getDepartmentLabel, getDepartmentColor } from "@/lib/auth/roles";

function getDefaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultTo(): string {
  return new Date().toISOString().split("T")[0];
}

export function DepartmentTab({
  department,
  transactions,
  drafts,
}: {
  department: Department;
  transactions: TransactionListItem[];
  drafts: DraftTransactionListItem[];
}) {
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const filtered = transactions.filter((txn) => {
    const txnDate = new Date(txn.completed_at || txn.created_at);
    return txnDate >= fromDate && txnDate <= toDate;
  });

  const totalRevenue = filtered.reduce(
    (sum, t) => sum + Number(t.final_total),
    0,
  );

  return (
    <>
      {/* Date filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "18px",
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
          className="buttonSecondary"
          type="button"
          onClick={() => {
            setFrom(getDefaultFrom());
            setTo(getDefaultTo());
          }}
        >
          Reset
        </button>
      </div>

      <div className="revenueGrid">
        <div
          className="revenueCard revenueCard--primary"
          style={{ borderLeft: `4px solid ${getDepartmentColor(department)}` }}
        >
          <span className="revenueCard__label">{getDepartmentLabel(department)} Revenue</span>
          <span className="revenueCard__value">
            ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Completed</span>
          <span className="revenueCard__value">{filtered.length}</span>
        </div>
        <div className="revenueCard">
          <span className="revenueCard__label">Drafts</span>
          <span className="revenueCard__value">{drafts.length}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
        <Link className="button" href={`/dashboard/sales?dept=${department}`}>
          New {getDepartmentLabel(department)} Sale
        </Link>
      </div>

      {drafts.length > 0 && (
        <section className="panel" style={{ marginTop: "18px" }}>
          <h3>Draft Transactions</h3>
          <ul className="list" style={{ marginTop: "8px" }}>
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Link href={`/dashboard/sales/${draft.id}`}>
                  Draft #{draft.transaction_number} — {new Date(draft.created_at).toLocaleDateString()}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filtered.length > 0 ? (
        <section className="panel" style={{ marginTop: "18px", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 0" }}>
            <h3>Transactions</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="txnTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cashier</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => (
                  <tr key={txn.id}>
                    <td><strong>{txn.transaction_number}</strong></td>
                    <td>{txn.cashier_name}</td>
                    <td>₱{Number(txn.final_total).toFixed(2)}</td>
                    <td className="muted">
                      {new Date(txn.completed_at || txn.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="panel" style={{ marginTop: "18px" }}>
          <p className="muted">
            {transactions.length === 0
              ? `No transactions yet for ${getDepartmentLabel(department)}.`
              : "No transactions found for the selected date range."}
          </p>
        </section>
      )}
    </>
  );
}
