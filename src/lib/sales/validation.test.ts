import { describe, expect, it } from "vitest";

import { validateCompletion } from "./validation";
import type { DraftSaleInput } from "./types";

const buildValidSale = (): DraftSaleInput => ({
  cashierName: "Mae",
  status: "draft",
  serviceLines: [
    {
      id: "line-1",
      serviceId: "svc-print",
      serviceName: "Sticker Print",
      materials: [
        {
          id: "mat-1",
          inventoryItemId: "inv-1",
          materialName: "Glossy Sticker",
          quantity: 2,
          unitPrice: 15,
          addOns: [
            {
              id: "addon-line-1",
              addOnId: "addon-1",
              name: "Cutting",
              quantity: 2,
              unitPrice: 5,
            },
          ],
        },
      ],
    },
  ],
  delivery: {
    enabled: false,
    customerName: "",
    address: "",
    dropOffLocation: "",
    deliveryFee: 0,
  },
  discount: null,
  payment: {
    method: "cash",
    cashReceived: 40,
  },
});

describe("validateCompletion", () => {
  it("accepts a complete cash sale with full payment coverage", () => {
    expect(validateCompletion(buildValidSale())).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it("requires the cashier name", () => {
    const sale = buildValidSale();
    sale.cashierName = " ";

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["Cashier name is required."],
    });
  });

  it("requires at least one service line", () => {
    const sale = buildValidSale();
    sale.serviceLines = [];

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["At least one service line is required."],
    });
  });

  it("requires materials on every service line and names the line", () => {
    const sale = buildValidSale();
    sale.serviceLines[0] = {
      ...sale.serviceLines[0],
      materials: [],
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["Service line Sticker Print must include at least one material."],
    });
  });

  it("returns the expected delivery field errors when delivery is enabled", () => {
    const sale = buildValidSale();
    sale.delivery = {
      enabled: true,
      customerName: "",
      address: "",
      dropOffLocation: "",
      deliveryFee: 50,
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: [
        "Delivery customer name is required.",
        "Delivery address is required.",
        "Drop-off location is required.",
      ],
    });
  });

  it("blocks discounts that would push the total below zero", () => {
    const sale = buildValidSale();
    sale.discount = {
      type: "fixed",
      value: 60,
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["Discount cannot reduce the total below zero."],
    });
  });

  it("requires a payment method", () => {
    const sale = buildValidSale();
    sale.payment = null;

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["Payment method is required."],
    });
  });

  it("requires cash payments to cover the final total", () => {
    const sale = buildValidSale();
    sale.payment = {
      method: "cash",
      cashReceived: 20,
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["Cash received must cover the final total."],
    });
  });

  it("requires gcash payments to cover the final total", () => {
    const sale = buildValidSale();
    sale.payment = {
      method: "gcash",
      amountPaid: 20,
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["GCash amount paid must cover the final total."],
    });
  });
});
