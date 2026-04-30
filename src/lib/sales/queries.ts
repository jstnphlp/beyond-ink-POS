import { cache } from "react";

import { createServerClient } from "@/lib/supabase/server";

import type { DraftSaleInput } from "./types";

export type SalesSetupData = {
  serviceCategories: { id: string; name: string }[];
  services: { id: string; name: string; is_active: boolean; category_id: string | null }[];
  addOns: { id: string; name: string; is_active: boolean }[];
  inventoryItems: {
    id: string;
    name: string;
    stock_on_hand: number;
    low_stock_threshold: number;
  }[];
  pricingReferences: {
    id: string;
    service_id: string;
    inventory_item_id: string;
    suggested_unit_price: number;
  }[];
};

export type DraftTransactionListItem = {
  id: string;
  transaction_number: number;
  created_at: string;
};

export type TransactionListItem = {
  id: string;
  transaction_number: number;
  status: string;
  cashier_name: string;
  final_total: number;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
};

export const getSalesSetupData = cache(async (): Promise<SalesSetupData> => {
  const supabase = await createServerClient();

  const [categoriesResult, servicesResult, addOnsResult, inventoryItemsResult, pricingReferencesResult] =
    await Promise.all([
      supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("services")
        .select("id, name, is_active, category_id")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("add_ons")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("inventory_items")
        .select("id, name, stock_on_hand, low_stock_threshold")
        .order("name"),
      supabase
        .from("service_material_prices")
        .select("id, service_id, inventory_item_id, suggested_unit_price"),
    ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (servicesResult.error) throw servicesResult.error;
  if (addOnsResult.error) throw addOnsResult.error;
  if (inventoryItemsResult.error) throw inventoryItemsResult.error;
  if (pricingReferencesResult.error) throw pricingReferencesResult.error;

  return {
    serviceCategories: categoriesResult.data ?? [],
    services: servicesResult.data ?? [],
    addOns: addOnsResult.data ?? [],
    inventoryItems: inventoryItemsResult.data ?? [],
    pricingReferences: pricingReferencesResult.data ?? [],
  };
});

export async function getDraftTransactions(): Promise<DraftTransactionListItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("id, transaction_number, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).filter(
    (row): row is DraftTransactionListItem =>
      typeof row.id === "string" &&
      typeof row.transaction_number === "number" &&
      typeof row.created_at === "string",
  );
}

export async function getDraftTransactionById(
  transactionId: string,
): Promise<DraftSaleInput | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("id, transaction_number, draft_payload")
    .eq("id", transactionId)
    .eq("status", "draft")
    .maybeSingle();

  if (error) throw error;
  if (!data?.draft_payload || typeof data.draft_payload !== "object") {
    return null;
  }

  return {
    ...(data.draft_payload as DraftSaleInput),
    transactionId: data.id,
    transactionNumber: data.transaction_number ?? undefined,
  };
}

export async function getTransactionHistory(): Promise<TransactionListItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("id, transaction_number, status, cashier_name, final_total, created_at, completed_at, cancelled_at")
    .in("status", ["completed", "cancelled"])
    .order("transaction_number", { ascending: false });

  if (error) throw error;

  return (data ?? []) as TransactionListItem[];
}
