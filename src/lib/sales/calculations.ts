import type { SaleDiscountInput, ServiceLineInput } from "./types";

export const calculateSubtotal = (serviceLines: ServiceLineInput[]): number =>
  serviceLines.reduce((saleTotal, serviceLine) => {
    const lineTotal = serviceLine.materials.reduce((materialTotal, material) => {
      const addOnTotal = (material.addOns ?? []).reduce(
        (runningAddOnTotal, addOn) => runningAddOnTotal + addOn.quantity * addOn.unitPrice,
        0,
      );

      return materialTotal + material.quantity * material.unitPrice + addOnTotal;
    }, 0);

    return saleTotal + lineTotal;
  }, 0);

export const calculateDiscountAmount = (
  subtotal: number,
  discount?: SaleDiscountInput,
): number => {
  if (!discount) {
    return 0;
  }

  if (discount.type === "percentage") {
    return (subtotal * discount.value) / 100;
  }

  return discount.value;
};

export const calculateFinalTotal = ({
  subtotal,
  discount,
  deliveryFee,
}: {
  subtotal: number;
  discount?: SaleDiscountInput;
  deliveryFee?: number;
}): number => Math.max(0, subtotal - calculateDiscountAmount(subtotal, discount) + (deliveryFee ?? 0));

export const calculateCashChange = (finalTotal: number, cashReceived?: number): number =>
  Math.max(0, (cashReceived ?? 0) - finalTotal);
