import type { DraftSaleInput, SaleDiscountInput } from "./types";

export const calculateSubtotal = ({
  serviceLines,
}: Pick<DraftSaleInput, "serviceLines">): number =>
  serviceLines.reduce((saleTotal, serviceLine) => {
    const lineTotal = serviceLine.materials.reduce((materialTotal, material) => {
      const addOnTotal = material.addOns.reduce(
        (runningAddOnTotal, addOn) => runningAddOnTotal + addOn.quantity * addOn.unitPrice,
        0,
      );

      return materialTotal + material.quantity * material.unitPrice + addOnTotal;
    }, 0);

    return saleTotal + lineTotal;
  }, 0);

export const calculateDiscountAmount = (
  subtotal: number,
  discount: SaleDiscountInput | null,
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
  discount: SaleDiscountInput | null;
  deliveryFee?: number;
}): number => subtotal - calculateDiscountAmount(subtotal, discount) + (deliveryFee ?? 0);

export const calculateCashChange = ({
  finalTotal,
  cashReceived,
}: {
  finalTotal: number;
  cashReceived: number;
}): number => Math.max(0, cashReceived - finalTotal);
