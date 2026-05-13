import * as XLSX from "xlsx";

import {
  calculateFinalTotal,
  calculateSubtotal,
  calculateDiscountAmount,
} from "./calculations";
import type { TransactionListItem } from "./queries";
import type { DraftSaleInput } from "./types";

/**
 * Export transaction history as a formatted Excel (.xlsx) file.
 *
 * Creates two sheets:
 *   1. "Sales Summary"       – one row per transaction with key totals
 *   2. "Detailed Breakdown"  – one row per material/add-on line item
 */
export function exportTransactionsToExcel(
  transactions: TransactionListItem[],
): void {
  const wb = XLSX.utils.book_new();

  // ───────────────────────────────── Sheet 1: Sales Summary ─────────────
  const summaryRows = transactions.map((txn) => {
    const payload = txn.draft_payload as DraftSaleInput | null;
    const subtotal = payload ? calculateSubtotal(payload) : 0;
    const discountAmt = payload
      ? calculateDiscountAmount(subtotal, payload.discount)
      : 0;
    const deliveryFee =
      payload?.delivery?.enabled ? payload.delivery.deliveryFee : 0;
    const finalTotal = payload
      ? calculateFinalTotal({
          subtotal,
          discount: payload.discount,
          deliveryFee,
        })
      : Number(txn.final_total);

    const paymentMethod = payload?.payment?.method ?? "—";
    const discountLabel = payload?.discount
      ? payload.discount.type === "percentage"
        ? `${payload.discount.value}%`
        : `₱${payload.discount.value.toFixed(2)}`
      : "None";

    return {
      "Txn #": txn.transaction_number,
      Cashier: txn.cashier_name,
      Status: txn.status.charAt(0).toUpperCase() + txn.status.slice(1),
      "Created At": formatDate(txn.created_at),
      "Completed At": txn.completed_at ? formatDate(txn.completed_at) : "—",
      Subtotal: subtotal,
      Discount: discountLabel,
      "Discount Amount": discountAmt,
      "Delivery Fee": deliveryFee,
      "Final Total": finalTotal,
      "Payment Method":
        paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  // Column widths for readability
  summarySheet["!cols"] = [
    { wch: 8 }, // Txn #
    { wch: 18 }, // Cashier
    { wch: 12 }, // Status
    { wch: 22 }, // Created At
    { wch: 22 }, // Completed At
    { wch: 14 }, // Subtotal
    { wch: 12 }, // Discount
    { wch: 16 }, // Discount Amount
    { wch: 14 }, // Delivery Fee
    { wch: 14 }, // Final Total
    { wch: 16 }, // Payment Method
  ];

  // Format currency columns as numbers
  formatCurrencyColumns(summarySheet, [5, 7, 8, 9], summaryRows.length);

  XLSX.utils.book_append_sheet(wb, summarySheet, "Sales Summary");

  // ──────────────────────────── Sheet 2: Detailed Breakdown ────────────
  const detailRows: Record<string, string | number>[] = [];

  for (const txn of transactions) {
    const payload = txn.draft_payload as DraftSaleInput | null;
    if (!payload) continue;

    for (const line of payload.serviceLines) {
      for (const mat of line.materials) {
        const matTotal = mat.quantity * mat.unitPrice;
        detailRows.push({
          "Txn #": txn.transaction_number,
          Cashier: txn.cashier_name,
          Date: txn.completed_at
            ? formatDate(txn.completed_at)
            : formatDate(txn.created_at),
          Service: line.serviceName,
          "Item Type": "Material",
          "Item Name": mat.materialName,
          Qty: mat.quantity,
          "Unit Price": mat.unitPrice,
          "Line Total": matTotal,
        });

        for (const addOn of mat.addOns) {
          const addOnTotal = addOn.quantity * addOn.unitPrice;
          detailRows.push({
            "Txn #": txn.transaction_number,
            Cashier: txn.cashier_name,
            Date: txn.completed_at
              ? formatDate(txn.completed_at)
              : formatDate(txn.created_at),
            Service: line.serviceName,
            "Item Type": "Add-On",
            "Item Name": addOn.name,
            Qty: addOn.quantity,
            "Unit Price": addOn.unitPrice,
            "Line Total": addOnTotal,
          });
        }
      }
    }
  }

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  detailSheet["!cols"] = [
    { wch: 8 }, // Txn #
    { wch: 18 }, // Cashier
    { wch: 22 }, // Date
    { wch: 28 }, // Service
    { wch: 12 }, // Item Type
    { wch: 28 }, // Item Name
    { wch: 6 }, // Qty
    { wch: 14 }, // Unit Price
    { wch: 14 }, // Line Total
  ];

  formatCurrencyColumns(detailSheet, [7, 8], detailRows.length);

  XLSX.utils.book_append_sheet(wb, detailSheet, "Detailed Breakdown");

  // ──────────────────────────── Trigger Download ───────────────────────
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Beyond-Ink_Sales-History_${today}.xlsx`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Apply number format "₱#,##0.00" to specific 0-indexed column indices
 * for every data row (skipping header row).
 */
function formatCurrencyColumns(
  sheet: XLSX.WorkSheet,
  colIndices: number[],
  rowCount: number,
): void {
  for (const col of colIndices) {
    for (let row = 1; row <= rowCount; row++) {
      const cellRef = XLSX.utils.encode_cell({ c: col, r: row });
      const cell = sheet[cellRef];
      if (cell && typeof cell.v === "number") {
        cell.z = "₱#,##0.00";
      }
    }
  }
}
