import { describe, expect, it } from "vitest";

import {
  calculateCashChange,
  calculateDiscountAmount,
  calculateFinalTotal,
  calculateSubtotal,
} from "./calculations";
import type { DraftSaleInput, ServiceLineInput } from "./types";

const serviceLines: ServiceLineInput[] = [
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
];

describe("calculateSubtotal", () => {
  it("includes material totals and add-ons", () => {
    expect(calculateSubtotal(serviceLines)).toBe(40);
  });
});

describe("calculateDiscountAmount", () => {
  it("computes percentage discounts from the subtotal", () => {
    expect(calculateDiscountAmount(200, { type: "percentage", value: 10 })).toBe(20);
  });
});

describe("calculateFinalTotal", () => {
  it("applies a percentage discount before adding delivery", () => {
    expect(
      calculateFinalTotal({
        subtotal: 200,
        discount: { type: "percentage", value: 10 },
        deliveryFee: 35,
      }),
    ).toBe(215);
  });

  it("does not let the computed total drop below zero", () => {
    expect(
      calculateFinalTotal({
        subtotal: 50,
        discount: { type: "fixed", value: 75 },
      }),
    ).toBe(0);
  });
});

describe("calculateCashChange", () => {
  it("returns change when the cash payment covers the total", () => {
    expect(calculateCashChange(180, 200)).toBe(20);
  });

  it("returns zero when the payment is short", () => {
    expect(calculateCashChange(180, 150)).toBe(0);
  });
});

describe("calculations composition", () => {
  it("supports deriving totals from a draft sale shape", () => {
    const sale: DraftSaleInput = {
      cashierName: "Mae",
      serviceLines,
      discount: { type: "fixed", value: 5 },
      delivery: {
        enabled: true,
        customerName: "Ana",
        address: "123 Main",
        dropOffLocation: "Front desk",
        fee: 20,
      },
      payment: {
        method: "cash",
        cashReceived: 100,
      },
      status: "draft",
    };

    const subtotal = calculateSubtotal(sale.serviceLines);
    const total = calculateFinalTotal({
      subtotal,
      discount: sale.discount,
      deliveryFee: sale.delivery?.fee,
    });

    expect(subtotal).toBe(40);
    expect(total).toBe(55);
  });
});
