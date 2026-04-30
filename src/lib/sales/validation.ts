import {
  calculateDiscountAmount,
  calculateFinalTotal,
  calculateSubtotal,
} from "./calculations";
import type { CompletionValidationResult, DraftSaleInput } from "./types";

const hasValue = (value?: string): boolean => Boolean(value?.trim());

export const validateCompletion = (sale: DraftSaleInput): CompletionValidationResult => {
  const errors: string[] = [];

  if (!hasValue(sale.cashierName)) {
    errors.push("Cashier name is required.");
  }

  if (sale.serviceLines.length === 0) {
    errors.push("At least one service line is required.");
  }

  const hasServiceLineWithoutMaterials = sale.serviceLines.some(
    (serviceLine) => serviceLine.materials.length === 0,
  );

  if (hasServiceLineWithoutMaterials) {
    errors.push("Each service line must include at least one material.");
  }

  if (sale.delivery?.enabled) {
    if (!hasValue(sale.delivery.customerName)) {
      errors.push("Customer name is required when delivery is enabled.");
    }

    if (!hasValue(sale.delivery.address)) {
      errors.push("Address is required when delivery is enabled.");
    }

    if (!hasValue(sale.delivery.dropOffLocation)) {
      errors.push("Drop-off location is required when delivery is enabled.");
    }

    if (sale.delivery.fee === undefined) {
      errors.push("Delivery fee is required when delivery is enabled.");
    }
  }

  const subtotal = calculateSubtotal(sale.serviceLines);
  const discountAmount = calculateDiscountAmount(subtotal, sale.discount);

  if (discountAmount > subtotal) {
    errors.push("Discount cannot reduce the total below zero.");
  }

  if (!sale.payment?.method) {
    errors.push("Payment method is required.");
  }

  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: sale.discount,
    deliveryFee: sale.delivery?.enabled ? sale.delivery.fee : 0,
  });

  if (
    errors.length === 0 &&
    sale.payment?.method === "cash" &&
    (sale.payment.cashReceived ?? 0) < finalTotal
  ) {
    errors.push("Cash payment must cover the final total.");
  }

  if (
    errors.length === 0 &&
    sale.payment?.method === "gcash" &&
    (sale.payment.amountPaid ?? 0) < finalTotal
  ) {
    errors.push("GCash payment must cover the final total.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
