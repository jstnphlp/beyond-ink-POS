"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import {
  buildDraftPayload,
  buildNormalizedSaleRecords,
  buildTransactionPayload,
} from "@/lib/sales/persistence";
import { validateCompletion } from "@/lib/sales/validation";
import { createServerClient } from "@/lib/supabase/server";

import type { DraftSaleInput } from "@/lib/sales/types";

type MutationResult =
  | { ok: true; transactionId: string; transactionNumber: number | null; errors: [] }
  | { ok: false; transactionId: null; transactionNumber: null; errors: string[] };

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

  const persistedDraft = buildDraftPayload(input, {
    transactionId: data.id,
    transactionNumber: data.transaction_number,
  });
  const normalizedRecords = buildNormalizedSaleRecords(data.id, persistedDraft);

  const { error: deleteChildRowsError } = await supabase
    .from("sales_service_lines")
    .delete()
    .eq("transaction_id", data.id);

  if (deleteChildRowsError) {
    throw deleteChildRowsError;
  }

  if (normalizedRecords.serviceLines.length > 0) {
    const { error: serviceLinesError } = await supabase
      .from("sales_service_lines")
      .insert(normalizedRecords.serviceLines);

    if (serviceLinesError) {
      throw serviceLinesError;
    }
  }

  if (normalizedRecords.materials.length > 0) {
    const { error: materialsError } = await supabase
      .from("sales_material_entries")
      .insert(normalizedRecords.materials);

    if (materialsError) {
      throw materialsError;
    }
  }

  if (normalizedRecords.addOns.length > 0) {
    const { error: addOnsError } = await supabase
      .from("sales_add_on_entries")
      .insert(normalizedRecords.addOns);

    if (addOnsError) {
      throw addOnsError;
    }
  }

  const { error: payloadSyncError } = await supabase
    .from("sales_transactions")
    .update({
      draft_payload: persistedDraft,
    })
    .eq("id", data.id);

  if (payloadSyncError) {
    throw payloadSyncError;
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
