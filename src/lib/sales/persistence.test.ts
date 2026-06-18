import { describe, expect, it } from "vitest";

import {
  buildDraftPayload,
  buildNormalizedSaleRecords,
  buildTransactionPayload,
} from "./persistence";
import type { DraftSaleInput } from "./types";

function buildSale(): DraftSaleInput {
  return {
    transactionId: "txn-1",
    transactionNumber: 101,
    department: "physical_dept",
    cashierName: "Mae",
    status: "draft",
    serviceLines: [
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
                id: "addon-row-1",
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
    discount: { type: "fixed", value: 5 },
    delivery: {
      enabled: true,
      customerName: "Ana",
      address: "123 Main",
      dropOffLocation: "Front Desk",
      deliveryFee: 20,
    },
    payment: {
      method: "cash",
      cashReceived: 100,
    },
  };
}

describe("buildTransactionPayload", () => {
  it("builds persisted totals and payment fields for a draft transaction", () => {
    const sale = buildSale();

    expect(buildTransactionPayload(sale, "draft")).toMatchObject({
      status: "draft",
      cashier_name: "Mae",
      customer_name: "Ana",
      delivery_enabled: true,
      delivery_address: "123 Main",
      drop_off_location: "Front Desk",
      delivery_fee: 20,
      discount_type: "fixed",
      discount_value: 5,
      subtotal: 40,
      final_total: 55,
      payment_method: "cash",
      cash_received: 100,
      gcash_amount_paid: null,
      change_due: 45,
      cancelled_at: null,
    });
  });
});

describe("buildDraftPayload", () => {
  it("stores the persisted transaction identifiers in the draft payload", () => {
    const sale = buildSale();

    expect(
      buildDraftPayload(sale, {
        transactionId: "txn-db-1",
        transactionNumber: 202,
      }),
    ).toMatchObject({
      transactionId: "txn-db-1",
      transactionNumber: 202,
      cashierName: "Mae",
    });
  });
});

describe("buildNormalizedSaleRecords", () => {
  it("maps service lines, materials, and add-ons into normalized row payloads", () => {
    const sale = buildSale();

    expect(buildNormalizedSaleRecords("txn-db-1", sale)).toEqual({
      serviceLines: [
        {
          id: "line-1",
          transaction_id: "txn-db-1",
          service_id: "svc-print",
          service_name: "Sticker Print",
          sort_order: 0,
        },
      ],
      materials: [
        {
          id: "mat-1",
          service_line_id: "line-1",
          inventory_item_id: "inv-1",
          material_name: "Glossy Sticker",
          quantity: 2,
          unit_price: 15,
        },
      ],
      addOns: [
        {
          id: "addon-row-1",
          material_entry_id: "mat-1",
          add_on_id: "addon-1",
          add_on_name: "Cutting",
          quantity: 2,
          unit_price: 5,
        },
      ],
    });
  });
});
