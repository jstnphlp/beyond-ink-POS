"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import {
  calculateCashChange,
  calculateFinalTotal,
  calculateSubtotal,
} from "@/lib/sales/calculations";
import { validateCompletion } from "@/lib/sales/validation";
import { createServerClient } from "@/lib/supabase/server";

import type { DraftSaleInput } from "@/lib/sales/types";

type MutationResult =
  | { ok: true; transactionId: string; transactionNumber: number | null; errors: [] }
  | { ok: false; transactionId: null; transactionNumber: null; errors: string[] };

function buildTransactionPayload(input: DraftSaleInput, status: "draft" | "completed") {
  const subtotal = calculateSubtotal(input);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: input.discount,
    deliveryFee: input.delivery.enabled ? input.delivery.deliveryFee : 0,
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
    draft_payload: input,
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

async function upsertTransaction(
  input: DraftSaleInput,
  status: "draft" | "completed",
): Promise<MutationResult> {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerClient();
  const payload = buildTransactionPayload(input, status);

  const query = input.transactionId
    ? supabase
        .from("sales_transactions")
        .update(payload)
        .eq("id", input.transactionId)
        .select("id, transaction_number")
        .single()
    : supabase
        .from("sales_transactions")
        .insert(payload)
        .select("id, transaction_number")
        .single();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");
  if (data?.id) {
    revalidatePath(`/dashboard/sales/${data.id}`);
  }

  return {
    ok: true,
    transactionId: data.id,
    transactionNumber: data.transaction_number,
    errors: [],
  };
}

export async function saveDraft(input: DraftSaleInput): Promise<MutationResult> {
  return upsertTransaction(input, "draft");
}

export async function cancelSale(transactionId: string) {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("sales_transactions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");
  revalidatePath(`/dashboard/sales/${transactionId}`);
}

export async function completeSale(input: DraftSaleInput): Promise<MutationResult> {
  const validation = validateCompletion(input);

  if (!validation.isValid) {
    return {
      ok: false,
      transactionId: null,
      transactionNumber: null,
      errors: validation.errors,
    };
  }

  const result = await upsertTransaction(input, "completed");

  if (!result.ok) {
    return result;
  }

  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerClient();

  for (const serviceLine of input.serviceLines) {
    for (const material of serviceLine.materials) {
      const { error } = await supabase.rpc("decrement_inventory_item_stock", {
        inventory_item_id_input: material.inventoryItemId,
        quantity_input: material.quantity,
        transaction_id_input: result.transactionId,
      });

      if (error) {
        throw error;
      }
    }
  }

  return result;
}
