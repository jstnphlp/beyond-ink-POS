import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import { createServerClient } from "@/lib/supabase/server";

import {
  ADD_ONS,
  PRICING_REFERENCES,
  SERVICE_CATEGORIES,
  SERVICES,
  getAddOnsByDepartment,
  getPricingReferencesByDepartment,
  getServiceCategoriesByDepartment,
  getServicesByDepartment,
  type Department,
} from "./static-catalog";
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
  department: string;
};

export type TransactionListItem = {
  id: string;
  transaction_number: number;
  status: string;
  department: string;
  cashier_name: string;
  final_total: number;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  draft_payload: DraftSaleInput | null;
};

// Create a generic anonymous client to safely use inside unstable_cache (since it doesn't access cookies)
function createAnonClient(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    token
      ? { global: { headers: { Authorization: `Bearer ${token}` } } }
      : undefined
  );
}

const getCachedInventoryItems = unstable_cache(
  async (token: string) => {
    const supabase = createAnonClient(token);

    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, stock_on_hand, low_stock_threshold")
      .order("name");

    if (error) throw error;
    return data ?? [];
  },
  ["inventory-items"],
  { tags: ["sales-setup-data"], revalidate: 3600 }
);

export async function getSalesSetupData(department?: Department): Promise<SalesSetupData> {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const inventoryItems = await getCachedInventoryItems(session?.access_token ?? "");

  if (department) {
    return {
      serviceCategories: getServiceCategoriesByDepartment(department),
      services: getServicesByDepartment(department),
      addOns: getAddOnsByDepartment(department),
      inventoryItems,
      pricingReferences: getPricingReferencesByDepartment(department),
    };
  }

  return {
    serviceCategories: SERVICE_CATEGORIES,
    services: SERVICES,
    addOns: ADD_ONS,
    inventoryItems,
    pricingReferences: PRICING_REFERENCES,
  };
}

export async function getDraftTransactions(department?: Department): Promise<DraftTransactionListItem[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("sales_transactions")
    .select("id, transaction_number, created_at, department")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (department) {
    query = query.eq("department", department);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as DraftTransactionListItem[];
}

export async function getDraftTransactionById(
  transactionId: string,
): Promise<DraftSaleInput | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("id, transaction_number, department, draft_payload")
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
    department: (data.department as Department) ?? "physical_dept",
  };
}

export async function getTransactionHistory(department?: Department): Promise<TransactionListItem[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("sales_transactions")
    .select("id, transaction_number, status, department, cashier_name, final_total, created_at, completed_at, cancelled_at, draft_payload")
    .eq("status", "completed")
    .order("transaction_number", { ascending: false });

  if (department) {
    query = query.eq("department", department);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as TransactionListItem[];
}

export async function getAllTransactionsWithDepartment(): Promise<TransactionListItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("id, transaction_number, status, department, cashier_name, final_total, created_at, completed_at, cancelled_at, draft_payload")
    .in("status", ["completed", "cancelled"])
    .order("transaction_number", { ascending: false });

  if (error) throw error;

  return (data ?? []) as TransactionListItem[];
}

export async function getTransactionsByDepartment(department: Department): Promise<TransactionListItem[]> {
  return getTransactionHistory(department);
}
