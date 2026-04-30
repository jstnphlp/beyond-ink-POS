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

  sale.serviceLines.forEach((serviceLine) => {
    if (serviceLine.materials.length === 0) {
      errors.push(`Service line ${serviceLine.serviceName} must include at least one material.`);
    }
  });

  if (sale.delivery.enabled) {
    if (!hasValue(sale.delivery.customerName)) {
      errors.push("Delivery customer name is required.");
    }

    if (!hasValue(sale.delivery.address)) {
      errors.push("Delivery address is required.");
    }

    if (!hasValue(sale.delivery.dropOffLocation)) {
      errors.push("Drop-off location is required.");
    }
  }

  const subtotal = calculateSubtotal(sale);
  const discountAmount = calculateDiscountAmount(subtotal, sale.discount);

  if (discountAmount > subtotal) {
    errors.push("Discount cannot reduce the total below zero.");
  }

  if (!sale.payment) {
    errors.push("Payment method is required.");
  }

  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: sale.discount,
    deliveryFee: sale.delivery.enabled ? sale.delivery.deliveryFee : 0,
  });

  if (errors.length === 0 && sale.payment?.method === "cash" && sale.payment.cashReceived < finalTotal) {
    errors.push("Cash received must cover the final total.");
  }

  if (errors.length === 0 && sale.payment?.method === "gcash" && sale.payment.amountPaid < finalTotal) {
    errors.push("GCash amount paid must cover the final total.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
