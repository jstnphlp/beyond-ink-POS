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
      materials: [
        {
          id: "mat-1",
          quantity: 2,
          unitPrice: 15,
          addOns: [
            {
              id: "addon-1",
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
    fee: 0,
  },
  discount: {
    type: "fixed",
    value: 0,
  },
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

  it("requires materials on every service line", () => {
    const sale = buildValidSale();
    sale.serviceLines[0] = {
      ...sale.serviceLines[0],
      materials: [],
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: ["Each service line must include at least one material."],
    });
  });

  it("returns the expected delivery field errors when delivery is enabled", () => {
    const sale = buildValidSale();
    sale.delivery = {
      enabled: true,
      fee: 50,
    };

    expect(validateCompletion(sale)).toEqual({
      isValid: false,
      errors: [
        "Customer name is required when delivery is enabled.",
        "Address is required when delivery is enabled.",
        "Drop-off location is required when delivery is enabled.",
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
    sale.payment = {};

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
      errors: ["Cash payment must cover the final total."],
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
      errors: ["GCash payment must cover the final total."],
    });
  });
});
