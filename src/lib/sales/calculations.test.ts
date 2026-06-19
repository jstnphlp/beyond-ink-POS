import { describe, expect, it } from "vitest";

import {
  calculateCashChange,
  calculateDiscountAmount,
  calculateFinalTotal,
  calculateSubtotal,
} from "./calculations";
import type { DraftSaleInput, SaleServiceLineInput } from "./types";

const serviceLines: SaleServiceLineInput[] = [
  {
    id: "line-1",
    categoryId: "cat-1",
    categoryName: "Standard Printing",
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
];

const buildDraftSaleInput = (): DraftSaleInput => ({
  department: "physical_dept",
  cashierName: "Paul",
  status: "draft",
  serviceLines,
  discount: { type: "fixed", value: 5 },
  delivery: {
    enabled: true,
    customerName: "Ana",
    address: "123 Main",
    dropOffLocation: "Front desk",
    deliveryFee: 20,
  },
  payment: {
    method: "cash",
    cashReceived: 100,
  },
});

describe("calculateSubtotal", () => {
  it("includes material totals and add-ons from the draft input shape", () => {
    expect(calculateSubtotal({ serviceLines })).toBe(40);
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

  it("allows the computed total to go negative so validation can block it", () => {
    expect(
      calculateFinalTotal({
        subtotal: 50,
        discount: { type: "fixed", value: 75 },
      }),
    ).toBe(-25);
  });
});

describe("calculateCashChange", () => {
  it("returns change when the cash payment covers the total", () => {
    expect(calculateCashChange({ finalTotal: 180, cashReceived: 200 })).toBe(20);
  });

  it("returns zero when the payment is short", () => {
    expect(calculateCashChange({ finalTotal: 180, cashReceived: 150 })).toBe(0);
  });
});

describe("calculations composition", () => {
  it("supports deriving totals from a draft sale shape", () => {
    const sale = buildDraftSaleInput();
    const subtotal = calculateSubtotal(sale);
    const total = calculateFinalTotal({
      subtotal,
      discount: sale.discount,
      deliveryFee: sale.delivery.deliveryFee,
    });

    expect(subtotal).toBe(40);
    expect(total).toBe(55);
  });
});
