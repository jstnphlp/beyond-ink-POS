"use server";

import { revalidatePath, revalidateTag } from "next/cache";

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

type UpsertResult = MutationResult & { supabase?: Awaited<ReturnType<typeof createServerClient>> };

async function upsertTransaction(
  input: DraftSaleInput,
  status: "draft" | "completed",
): Promise<UpsertResult> {
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

  // Delete existing children first (must complete before inserts)
  const { error: deleteChildRowsError } = await supabase
    .from("sales_service_lines")
    .delete()
    .eq("transaction_id", data.id);

  if (deleteChildRowsError) {
    throw deleteChildRowsError;
  }

  // Service lines must be inserted before materials/add-ons (FK dependency)
  if (normalizedRecords.serviceLines.length > 0) {
    const { error: serviceLinesError } = await supabase
      .from("sales_service_lines")
      .insert(normalizedRecords.serviceLines);

    if (serviceLinesError) {
      throw serviceLinesError;
    }
  }

  // Materials, add-ons, and payload sync can all run in parallel
  const parallelOps: Promise<void>[] = [];

  if (normalizedRecords.materials.length > 0) {
    parallelOps.push(
      Promise.resolve(
        supabase
          .from("sales_material_entries")
          .insert(normalizedRecords.materials),
      ).then(({ error: e }) => { if (e) throw e; }),
    );
  }

  if (normalizedRecords.addOns.length > 0) {
    parallelOps.push(
      Promise.resolve(
        supabase
          .from("sales_add_on_entries")
          .insert(normalizedRecords.addOns),
      ).then(({ error: e }) => { if (e) throw e; }),
    );
  }

  parallelOps.push(
    Promise.resolve(
      supabase
        .from("sales_transactions")
        .update({ draft_payload: persistedDraft })
        .eq("id", data.id),
    ).then(({ error: e }) => { if (e) throw e; }),
  );

  await Promise.all(parallelOps);

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
    supabase,
  };
}

export async function saveDraft(input: DraftSaleInput): Promise<MutationResult> {
  const { supabase: _, ...result } = await upsertTransaction(input, "draft");
  return result;
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

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");
  revalidatePath(`/dashboard/sales/${transactionId}`);
}

export async function deleteDraft(transactionId: string) {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerClient();

  // Only allow deleting drafts
  const { data: existing } = await supabase
    .from("sales_transactions")
    .select("status")
    .eq("id", transactionId)
    .single();

  if (!existing || existing.status !== "draft") {
    throw new Error("Only draft transactions can be deleted.");
  }

  const { error } = await supabase
    .from("sales_transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");
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

  // Reuse the supabase client from upsertTransaction (no redundant auth + client creation)
  const supabase = result.supabase!;

  // Run all inventory decrements in parallel instead of sequentially
  const decrementOps = input.serviceLines.flatMap((serviceLine) =>
    serviceLine.materials.map((material) =>
      Promise.resolve(
        supabase.rpc("decrement_inventory_item_stock", {
          inventory_item_id_input: material.inventoryItemId,
          quantity_input: material.quantity,
          transaction_id_input: result.transactionId,
        }),
      ).then(({ error }) => { if (error) throw error; }),
    ),
  );

  if (decrementOps.length > 0) {
    await Promise.all(decrementOps);
  }

  // Revalidate inventory cache since stock levels changed
  revalidateTag("sales-setup-data", {});

  const { supabase: _, ...cleanResult } = result;
  return cleanResult;
}

export async function deleteTransaction(transactionId: string) {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("sales_transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/history");
}

export async function revalidateSetupData() {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  revalidateTag("sales-setup-data", {});
  revalidatePath("/dashboard/sales", "page");
}

export async function updateTransactionDates(
  transactionId: string,
  updates: { created_at?: string; completed_at?: string | null },
) {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("sales_transactions")
    .update(updates)
    .eq("id", transactionId);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard/sales/history");
}
