import {
  calculateCashChange,
  calculateFinalTotal,
  calculateSubtotal,
} from "./calculations";
import type { DraftSaleInput } from "./types";

export function buildDraftPayload(
  input: DraftSaleInput,
  persisted: { transactionId: string; transactionNumber: number | null },
): DraftSaleInput {
  return {
    ...input,
    transactionId: persisted.transactionId,
    transactionNumber: persisted.transactionNumber ?? undefined,
  };
}

export function buildTransactionPayload(
  input: DraftSaleInput,
  status: "draft" | "completed",
) {
  const subtotal = calculateSubtotal(input);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: input.discount,
    deliveryFee: input.delivery.enabled ? input.delivery.deliveryFee : 0,
  });

  const draftPayload = buildDraftPayload(input, {
    transactionId: input.transactionId ?? "",
    transactionNumber: input.transactionNumber ?? null,
  });

  return {
    status,
    cashier_name: input.cashierName,
    customer_name: input.delivery.enabled ? input.delivery.customerName : null,
    delivery_enabled: input.delivery.enabled,
    delivery_address: input.delivery.enabled ? input.delivery.address : null,
    drop_off_location: input.delivery.enabled ? input.delivery.dropOffLocation : null,
    delivery_fee: input.delivery.enabled ? input.delivery.deliveryFee : 0,
    discount_type: input.discount?.type ?? null,
    discount_value: input.discount?.value ?? null,
    draft_payload: draftPayload,
    subtotal,
    final_total: finalTotal,
    payment_method: input.payment?.method ?? null,
    cash_received: input.payment?.method === "cash" ? input.payment.cashReceived : null,
    gcash_amount_paid: input.payment?.method === "gcash" ? input.payment.amountPaid : null,
    change_due:
      input.payment?.method === "cash"
        ? calculateCashChange({
            finalTotal,
            cashReceived: input.payment.cashReceived,
          })
        : null,
    completed_at: status === "completed" ? new Date().toISOString() : null,
    cancelled_at: null,
  };
}

export function buildNormalizedSaleRecords(transactionId: string, input: DraftSaleInput) {
  // Filter out incomplete service lines (no service selected) to avoid
  // inserting empty strings into UUID columns (PostgreSQL 22P02).
  const validServiceLines = input.serviceLines.filter(
    (line) => line.serviceId && line.serviceId.trim() !== "",
  );

  const serviceLines = validServiceLines.map((serviceLine, index) => ({
    id: serviceLine.id,
    transaction_id: transactionId,
    service_id: serviceLine.serviceId,
    service_name: serviceLine.serviceName,
    sort_order: index,
  }));

  const materials = validServiceLines.flatMap((serviceLine) =>
    serviceLine.materials
      .filter((m) => m.inventoryItemId && m.inventoryItemId.trim() !== "")
      .map((material) => ({
        id: material.id,
        service_line_id: serviceLine.id,
        inventory_item_id: material.inventoryItemId,
        material_name: material.materialName,
        quantity: material.quantity,
        unit_price: material.unitPrice,
      })),
  );

  const addOns = validServiceLines.flatMap((serviceLine) =>
    serviceLine.materials.flatMap((material) =>
      material.addOns
        .filter((a) => a.addOnId && a.addOnId.trim() !== "")
        .map((addOn) => ({
          id: addOn.id,
          material_entry_id: material.id,
          add_on_id: addOn.addOnId,
          add_on_name: addOn.name,
          quantity: addOn.quantity,
          unit_price: addOn.unitPrice,
        })),
    ),
  );

  return {
    serviceLines,
    materials,
    addOns,
  };
}
