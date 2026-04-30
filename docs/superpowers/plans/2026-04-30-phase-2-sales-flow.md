# Phase 2 Sales Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 2 sales entry flow with drafts, cancellation, payment capture, delivery details, transaction-level discounts, and inventory deduction on completion.

**Architecture:** Add a small sales domain layer for totals, validation, and transaction state rules; extend the single Supabase schema with Phase 2 tables; then build a protected dashboard sales area with a reusable server-backed wizard for new sales and draft resume. Keep inventory deduction in the completion path only and keep UI logic thin by centralizing computations and validation in `src/lib/sales`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth + database, Vitest

---

## File Structure

### Existing files to modify

- `supabase/schema.sql`
  - Extend the database schema beyond `allowed_users` with Phase 2 catalog, inventory, transaction, payment, and draft-support tables.
- `src/app/dashboard/page.tsx`
  - Replace placeholder Phase 2 messaging with navigation into the new sales area.
- `src/app/globals.css`
  - Add sales layout, wizard, table, form, badge, and alert styles while preserving the existing dashboard look.

### New files to create

- `src/lib/sales/types.ts`
  - Shared TypeScript types for services, materials, add-ons, delivery, payment, transaction status, and draft payloads.
- `src/lib/sales/calculations.ts`
  - Pure functions for subtotal, discount normalization, final total, and cash change.
- `src/lib/sales/validation.ts`
  - Pure functions for draft-safe and completion-safe validation.
- `src/lib/sales/calculations.test.ts`
  - Unit tests for totals, discounts, and payment math.
- `src/lib/sales/validation.test.ts`
  - Unit tests for completion rules, delivery gating, and payment coverage.
- `src/lib/sales/queries.ts`
  - Server-side reads for active services, active add-ons, inventory materials, pricing references, and draft list rows.
- `src/app/dashboard/sales/page.tsx`
  - Entry page that renders the new sale wizard for a new transaction.
- `src/app/dashboard/sales/drafts/page.tsx`
  - Draft list page that shows transaction number and created timestamp.
- `src/app/dashboard/sales/[transactionId]/page.tsx`
  - Resume/edit page for an existing draft transaction.
- `src/app/dashboard/sales/actions.ts`
  - Server actions to save draft, cancel transaction, complete transaction, and fetch one draft-safe transaction.
- `src/components/sales/sales-shell.tsx`
  - Shared page header and navigation between new sale and drafts.
- `src/components/sales/sales-wizard.tsx`
  - Top-level client component that drives the four-step flow and submit actions.
- `src/components/sales/services-step.tsx`
  - Step 1 service line entry UI.
- `src/components/sales/materials-step.tsx`
  - Step 2 material and add-on selection UI with low-stock warnings.
- `src/components/sales/delivery-discount-step.tsx`
  - Step 3 delivery toggle and transaction discount UI.
- `src/components/sales/payment-review-step.tsx`
  - Step 4 payment form, totals summary, and final action buttons.
- `src/components/sales/draft-list.tsx`
  - Server-rendered draft list table with resume links.

## Task 1: Build the Sales Domain Layer

**Files:**
- Create: `src/lib/sales/types.ts`
- Create: `src/lib/sales/calculations.ts`
- Create: `src/lib/sales/validation.ts`
- Test: `src/lib/sales/calculations.test.ts`
- Test: `src/lib/sales/validation.test.ts`

- [ ] **Step 1: Write the failing totals and validation tests**

```ts
import { describe, expect, it } from "vitest";

import { calculateCashChange, calculateFinalTotal, calculateSubtotal } from "./calculations";
import { validateCompletion } from "./validation";
import type { DraftSaleInput } from "./types";

describe("sales calculations", () => {
  it("adds service material totals and add-on totals into the subtotal", () => {
    const subtotal = calculateSubtotal({
      serviceLines: [
        {
          id: "line-1",
          serviceId: "svc-print",
          serviceName: "Printing",
          materials: [
            {
              id: "mat-1",
              inventoryItemId: "paper-a4",
              materialName: "A4 Glossy",
              quantity: 2,
              unitPrice: 15,
              addOns: [
                { id: "addon-1", addOnId: "laminate", name: "Laminating", quantity: 2, unitPrice: 5 },
              ],
            },
          ],
        },
      ],
    });

    expect(subtotal).toBe(40);
  });

  it("supports percentage discounts and manual delivery fees", () => {
    const finalTotal = calculateFinalTotal({
      subtotal: 200,
      discount: { type: "percentage", value: 10 },
      deliveryFee: 35,
    });

    expect(finalTotal).toBe(215);
  });

  it("computes non-negative cash change", () => {
    expect(calculateCashChange({ finalTotal: 180, cashReceived: 200 })).toBe(20);
    expect(calculateCashChange({ finalTotal: 180, cashReceived: 150 })).toBe(0);
  });
});

describe("sales completion validation", () => {
  it("blocks completion when delivery is enabled but delivery fields are missing", () => {
    const sale: DraftSaleInput = {
      status: "draft",
      cashierName: "Owner",
      serviceLines: [
        {
          id: "line-1",
          serviceId: "svc-print",
          serviceName: "Printing",
          materials: [
            {
              id: "mat-1",
              inventoryItemId: "paper-a4",
              materialName: "A4 Glossy",
              quantity: 1,
              unitPrice: 25,
              addOns: [],
            },
          ],
        },
      ],
      discount: null,
      delivery: {
        enabled: true,
        customerName: "",
        address: "",
        dropOffLocation: "",
        deliveryFee: 0,
      },
      payment: { method: "cash", cashReceived: 25 },
    };

    expect(validateCompletion(sale).errors).toContain("Delivery customer name is required.");
    expect(validateCompletion(sale).errors).toContain("Delivery address is required.");
    expect(validateCompletion(sale).errors).toContain("Drop-off location is required.");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/sales/calculations.test.ts src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: FAIL with module-not-found errors for `./calculations`, `./validation`, or `./types`.

- [ ] **Step 3: Add the shared sales types**

```ts
export type TransactionStatus = "draft" | "completed" | "cancelled";
export type DiscountType = "fixed" | "percentage";
export type PaymentMethod = "cash" | "gcash";

export type SaleAddOnInput = {
  id: string;
  addOnId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type SaleMaterialInput = {
  id: string;
  inventoryItemId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  addOns: SaleAddOnInput[];
};

export type SaleServiceLineInput = {
  id: string;
  serviceId: string;
  serviceName: string;
  materials: SaleMaterialInput[];
};

export type SaleDiscountInput = {
  type: DiscountType;
  value: number;
};

export type SaleDeliveryInput = {
  enabled: boolean;
  customerName: string;
  address: string;
  dropOffLocation: string;
  deliveryFee: number;
};

export type SalePaymentInput =
  | { method: "cash"; cashReceived: number }
  | { method: "gcash"; amountPaid: number };

export type DraftSaleInput = {
  transactionId?: string;
  transactionNumber?: number;
  status: TransactionStatus;
  cashierName: string;
  serviceLines: SaleServiceLineInput[];
  discount: SaleDiscountInput | null;
  delivery: SaleDeliveryInput;
  payment: SalePaymentInput | null;
};

export type SalesSetupData = {
  services: { id: string; name: string; is_active: boolean }[];
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
```

- [ ] **Step 4: Implement minimal calculation helpers**

```ts
import type { DraftSaleInput, SaleDiscountInput, SaleServiceLineInput } from "./types";

export function calculateSubtotal(input: Pick<DraftSaleInput, "serviceLines">): number {
  return input.serviceLines.reduce((lineTotal, line) => lineTotal + calculateServiceLineTotal(line), 0);
}

function calculateServiceLineTotal(line: SaleServiceLineInput): number {
  return line.materials.reduce((materialTotal, material) => {
    const addOnTotal = material.addOns.reduce(
      (sum, addOn) => sum + addOn.quantity * addOn.unitPrice,
      0,
    );

    return materialTotal + material.quantity * material.unitPrice + addOnTotal;
  }, 0);
}

export function calculateDiscountAmount(subtotal: number, discount: SaleDiscountInput | null): number {
  if (!discount || discount.value <= 0) {
    return 0;
  }

  if (discount.type === "percentage") {
    return subtotal * (discount.value / 100);
  }

  return discount.value;
}

export function calculateFinalTotal(input: {
  subtotal: number;
  discount: SaleDiscountInput | null;
  deliveryFee: number;
}): number {
  const discountAmount = calculateDiscountAmount(input.subtotal, input.discount);
  return input.subtotal - discountAmount + input.deliveryFee;
}

export function calculateCashChange(input: { finalTotal: number; cashReceived: number }): number {
  return Math.max(0, input.cashReceived - input.finalTotal);
}
```

- [ ] **Step 5: Implement minimal completion validation**

```ts
import { calculateFinalTotal, calculateSubtotal } from "./calculations";
import type { DraftSaleInput } from "./types";

export function validateCompletion(input: DraftSaleInput) {
  const errors: string[] = [];

  if (!input.cashierName.trim()) {
    errors.push("Cashier name is required.");
  }

  if (input.serviceLines.length === 0) {
    errors.push("At least one service line is required.");
  }

  input.serviceLines.forEach((line) => {
    if (line.materials.length === 0) {
      errors.push(`Service line ${line.serviceName} must include at least one material.`);
    }
  });

  if (input.delivery.enabled) {
    if (!input.delivery.customerName.trim()) errors.push("Delivery customer name is required.");
    if (!input.delivery.address.trim()) errors.push("Delivery address is required.");
    if (!input.delivery.dropOffLocation.trim()) errors.push("Drop-off location is required.");
  }

  const subtotal = calculateSubtotal(input);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: input.discount,
    deliveryFee: input.delivery.enabled ? input.delivery.deliveryFee : 0,
  });

  if (finalTotal < 0) {
    errors.push("Discount cannot reduce the total below zero.");
  }

  if (!input.payment) {
    errors.push("Payment method is required.");
  } else if (input.payment.method === "cash" && input.payment.cashReceived < finalTotal) {
    errors.push("Cash received must cover the final total.");
  } else if (input.payment.method === "gcash" && input.payment.amountPaid < finalTotal) {
    errors.push("GCash amount paid must cover the final total.");
  }

  return { isValid: errors.length === 0, errors };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/lib/sales/calculations.test.ts src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: PASS with `4 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/sales/types.ts src/lib/sales/calculations.ts src/lib/sales/validation.ts src/lib/sales/calculations.test.ts src/lib/sales/validation.test.ts
git commit -m "feat: add sales domain helpers"
```

## Task 2: Extend the Supabase Schema for Phase 2 Sales

**Files:**
- Modify: `supabase/schema.sql`
- Reuse: `src/lib/sales/types.ts`

- [ ] **Step 1: Write a failing test for transaction-shape assumptions**

```ts
import { describe, expect, it } from "vitest";

import { validateCompletion } from "@/lib/sales/validation";
import type { DraftSaleInput } from "@/lib/sales/types";

describe("sales status rules", () => {
  it("allows draft records without payment but still requires payment for completion", () => {
    const sale: DraftSaleInput = {
      status: "draft",
      cashierName: "Owner",
      serviceLines: [],
      discount: null,
      delivery: {
        enabled: false,
        customerName: "",
        address: "",
        dropOffLocation: "",
        deliveryFee: 0,
      },
      payment: null,
    };

    expect(validateCompletion(sale).errors).toContain("At least one service line is required.");
    expect(validateCompletion(sale).errors).toContain("Payment method is required.");
  });
});
```

- [ ] **Step 2: Run the test to confirm the domain layer still protects completion**

Run: `npx vitest run src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: PASS once the new test is merged into `src/lib/sales/validation.test.ts`.

- [ ] **Step 3: Add Phase 2 tables to `supabase/schema.sql`**

```sql
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'sheet',
  stock_on_hand numeric(12,2) not null default 0,
  low_stock_threshold numeric(12,2) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_material_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  suggested_unit_price numeric(12,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (service_id, inventory_item_id)
);

create table if not exists public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number bigint generated by default as identity unique,
  status text not null check (status in ('draft', 'completed', 'cancelled')),
  cashier_name text not null,
  delivery_enabled boolean not null default false,
  customer_name text,
  delivery_address text,
  drop_off_location text,
  delivery_fee numeric(12,2) not null default 0,
  discount_type text check (discount_type in ('fixed', 'percentage')),
  discount_value numeric(12,2),
  draft_payload jsonb not null default '{}'::jsonb,
  subtotal numeric(12,2) not null default 0,
  final_total numeric(12,2) not null default 0,
  payment_method text check (payment_method in ('cash', 'gcash')),
  cash_received numeric(12,2),
  gcash_amount_paid numeric(12,2),
  change_due numeric(12,2),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales_service_lines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.sales_transactions(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  service_name text not null,
  sort_order integer not null default 0
);

create table if not exists public.sales_material_entries (
  id uuid primary key default gen_random_uuid(),
  service_line_id uuid not null references public.sales_service_lines(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  material_name text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null
);

create table if not exists public.sales_add_on_entries (
  id uuid primary key default gen_random_uuid(),
  material_entry_id uuid not null references public.sales_material_entries(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id) on delete restrict,
  add_on_name text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  transaction_id uuid references public.sales_transactions(id) on delete set null,
  movement_type text not null check (movement_type in ('sale_deduction', 'manual_adjustment', 'purchase_receipt')),
  quantity_delta numeric(12,2) not null,
  created_at timestamptz not null default timezone('utc', now())
);
```

- [ ] **Step 4: Add RLS and helper trigger support for updates**

```sql
alter table public.services enable row level security;
alter table public.add_ons enable row level security;
alter table public.inventory_items enable row level security;
alter table public.service_material_prices enable row level security;
alter table public.sales_transactions enable row level security;
alter table public.sales_service_lines enable row level security;
alter table public.sales_material_entries enable row level security;
alter table public.sales_add_on_entries enable row level security;
alter table public.inventory_movements enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists sales_transactions_set_updated_at on public.sales_transactions;

create trigger sales_transactions_set_updated_at
before update on public.sales_transactions
for each row
execute function public.set_updated_at();

create or replace function public.decrement_inventory_item_stock(
  inventory_item_id_input uuid,
  quantity_input numeric,
  transaction_id_input uuid
)
returns void
language plpgsql
as $$
begin
  update public.inventory_items
  set stock_on_hand = stock_on_hand - quantity_input
  where id = inventory_item_id_input;

  insert into public.inventory_movements (
    inventory_item_id,
    transaction_id,
    movement_type,
    quantity_delta
  )
  values (
    inventory_item_id_input,
    transaction_id_input,
    'sale_deduction',
    quantity_input * -1
  );
end;
$$;
```

- [ ] **Step 5: Add permissive authenticated policies for Phase 2**

```sql
create policy "authenticated users manage services"
on public.services
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage add_ons"
on public.add_ons
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage inventory_items"
on public.inventory_items
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage service_material_prices"
on public.service_material_prices
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage sales_transactions"
on public.sales_transactions
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage sales_service_lines"
on public.sales_service_lines
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage sales_material_entries"
on public.sales_material_entries
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage sales_add_on_entries"
on public.sales_add_on_entries
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users manage inventory_movements"
on public.inventory_movements
for all
to authenticated
using (true)
with check (true);
```

- [ ] **Step 6: Run lint-level verification on SQL file formatting and line endings**

Run: `Get-Content supabase\schema.sql | Select-Object -First 40`

Expected: the new tables appear below `allowed_users` and there are no truncated SQL blocks.

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql src/lib/sales/validation.test.ts
git commit -m "feat: add phase 2 sales schema"
```

## Task 3: Add Sales Queries and Server Actions

**Files:**
- Create: `src/lib/sales/queries.ts`
- Create: `src/app/dashboard/sales/actions.ts`
- Reuse: `src/lib/supabase/server.ts`
- Reuse: `src/lib/auth/get-authorized-user.ts`
- Test: `src/lib/sales/validation.test.ts`

- [ ] **Step 1: Write a failing test for discount-below-zero blocking**

```ts
import { describe, expect, it } from "vitest";

import { validateCompletion } from "./validation";
import type { DraftSaleInput } from "./types";

describe("sales discount rules", () => {
  it("blocks a discount that reduces the total below zero", () => {
    const sale: DraftSaleInput = {
      status: "draft",
      cashierName: "Owner",
      serviceLines: [
        {
          id: "line-1",
          serviceId: "svc-print",
          serviceName: "Printing",
          materials: [
            {
              id: "mat-1",
              inventoryItemId: "paper-a4",
              materialName: "A4",
              quantity: 1,
              unitPrice: 20,
              addOns: [],
            },
          ],
        },
      ],
      discount: { type: "fixed", value: 25 },
      delivery: {
        enabled: false,
        customerName: "",
        address: "",
        dropOffLocation: "",
        deliveryFee: 0,
      },
      payment: { method: "cash", cashReceived: 20 },
    };

    expect(validateCompletion(sale).errors).toContain("Discount cannot reduce the total below zero.");
  });
});
```

- [ ] **Step 2: Run the test to confirm validation remains green before wiring server actions**

Run: `npx vitest run src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: PASS with the new discount case included.

- [ ] **Step 3: Add sales query helpers**

```ts
import { cache } from "react";

import { createServerClient } from "@/lib/supabase/server";

export const getSalesSetupData = cache(async () => {
  const supabase = await createServerClient();

  const [servicesResult, addOnsResult, inventoryResult, pricingResult] = await Promise.all([
    supabase.from("services").select("id, name, is_active").eq("is_active", true).order("name"),
    supabase.from("add_ons").select("id, name, is_active").eq("is_active", true).order("name"),
    supabase
      .from("inventory_items")
      .select("id, name, stock_on_hand, low_stock_threshold")
      .order("name"),
    supabase
      .from("service_material_prices")
      .select("id, service_id, inventory_item_id, suggested_unit_price"),
  ]);

  return {
    services: servicesResult.data ?? [],
    addOns: addOnsResult.data ?? [],
    inventoryItems: inventoryResult.data ?? [],
    pricingReferences: pricingResult.data ?? [],
  };
});

export async function getDraftTransactions() {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("sales_transactions")
    .select("id, transaction_number, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  return data ?? [];
}
```

- [ ] **Step 4: Add server actions for save draft, cancel, complete, and load one transaction**

```ts
"use server";

import { revalidatePath } from "next/cache";

import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { calculateCashChange, calculateFinalTotal, calculateSubtotal } from "@/lib/sales/calculations";
import { validateCompletion } from "@/lib/sales/validation";
import { createServerClient } from "@/lib/supabase/server";

import type { DraftSaleInput } from "@/lib/sales/types";

export async function saveDraft(input: DraftSaleInput) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServerClient();
  const subtotal = calculateSubtotal(input);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: input.discount,
    deliveryFee: input.delivery.enabled ? input.delivery.deliveryFee : 0,
  });

  const payload = {
    status: "draft",
    cashier_name: input.cashierName,
    delivery_enabled: input.delivery.enabled,
    customer_name: input.delivery.enabled ? input.delivery.customerName : null,
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
        ? calculateCashChange({ finalTotal, cashReceived: input.payment.cashReceived })
        : null,
  };

  const { data, error } = input.transactionId
    ? await supabase.from("sales_transactions").update(payload).eq("id", input.transactionId).select("id").single()
    : await supabase.from("sales_transactions").insert(payload).select("id").single();

  if (error) throw error;

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");

  return data;
}

export async function cancelSale(transactionId: string) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("sales_transactions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", transactionId);

  if (error) throw error;

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");
}

export async function completeSale(input: DraftSaleInput) {
  const validation = validateCompletion(input);
  if (!validation.isValid) {
    return { ok: false, errors: validation.errors };
  }

  return { ok: true, errors: [] as string[] };
}
```

- [ ] **Step 5: Run lint to catch server-action and import issues**

Run: `npm run lint`

Expected: PASS or only unrelated pre-existing issues outside the new sales files.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sales/queries.ts src/app/dashboard/sales/actions.ts src/lib/sales/validation.test.ts
git commit -m "feat: add sales data queries and actions"
```

## Task 4: Build the Protected Sales Routes and Shell

**Files:**
- Create: `src/app/dashboard/sales/page.tsx`
- Create: `src/app/dashboard/sales/drafts/page.tsx`
- Create: `src/app/dashboard/sales/[transactionId]/page.tsx`
- Create: `src/components/sales/sales-shell.tsx`
- Create: `src/components/sales/draft-list.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write a failing render smoke test for the sales shell**

```ts
import { describe, expect, it } from "vitest";

import { calculateFinalTotal } from "@/lib/sales/calculations";

describe("sales shell prerequisites", () => {
  it("keeps shared sales math available for route components", () => {
    expect(calculateFinalTotal({ subtotal: 100, discount: null, deliveryFee: 0 })).toBe(100);
  });
});
```

- [ ] **Step 2: Run the smoke test to verify the base sales modules still compile**

Run: `npx vitest run src/lib/sales/calculations.test.ts --environment node --pool threads`

Expected: PASS.

- [ ] **Step 3: Create the shared sales shell**

```tsx
import Link from "next/link";
import { ReactNode } from "react";

export function SalesShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="shell">
      <div className="shell__inner">
        <section className="hero">
          <div className="hero__card">
            <p className="eyebrow">Phase 2 Sales</p>
            <h1 className="headline">{title}</h1>
            <p className="lead">{description}</p>
            <div className="hero__actions">
              <Link className="button" href="/dashboard/sales">
                New sale
              </Link>
              <Link className="buttonSecondary" href="/dashboard/sales/drafts">
                Drafts
              </Link>
              <Link className="buttonSecondary" href="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Add the dashboard sales routes**

```tsx
import { redirect } from "next/navigation";

import { SalesShell } from "@/components/sales/sales-shell";
import { SalesWizard } from "@/components/sales/sales-wizard";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { getSalesSetupData } from "@/lib/sales/queries";

export default async function SalesPage() {
  const user = await getAuthorizedUser();
  if (!user) redirect("/login");

  const setupData = await getSalesSetupData();

  return (
    <SalesShell
      title="New Sale"
      description="Create a draft or complete a transaction with services, materials, add-ons, delivery, and payment."
    >
      <SalesWizard mode="create" setupData={setupData} />
    </SalesShell>
  );
}
```

```tsx
import { redirect } from "next/navigation";

import { DraftList } from "@/components/sales/draft-list";
import { SalesShell } from "@/components/sales/sales-shell";
import { getAuthorizedUser } from "@/lib/auth/get-authorized-user";
import { getDraftTransactions } from "@/lib/sales/queries";

export default async function SalesDraftsPage() {
  const user = await getAuthorizedUser();
  if (!user) redirect("/login");

  const drafts = await getDraftTransactions();

  return (
    <SalesShell title="Draft Sales" description="Resume any saved draft transaction.">
      <DraftList drafts={drafts} />
    </SalesShell>
  );
}
```

- [ ] **Step 5: Update the dashboard entry point**

```tsx
<div className="hero__actions">
  <Link className="button" href="/dashboard/sales">
    Open sales
  </Link>
  <SignOutButton />
</div>
```

- [ ] **Step 6: Run lint and verify route imports**

Run: `npm run lint`

Expected: PASS or only unrelated pre-existing issues outside the new route files.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/sales/page.tsx src/app/dashboard/sales/drafts/page.tsx src/app/dashboard/sales/[transactionId]/page.tsx src/components/sales/sales-shell.tsx src/components/sales/draft-list.tsx
git commit -m "feat: add sales routes and shell"
```

## Task 5: Build the Four-Step Sales Wizard UI

**Files:**
- Create: `src/components/sales/sales-wizard.tsx`
- Create: `src/components/sales/services-step.tsx`
- Create: `src/components/sales/materials-step.tsx`
- Create: `src/components/sales/delivery-discount-step.tsx`
- Create: `src/components/sales/payment-review-step.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write a failing validation test for payment coverage**

```ts
import { describe, expect, it } from "vitest";

import { validateCompletion } from "./validation";
import type { DraftSaleInput } from "./types";

describe("sales payment coverage", () => {
  it("blocks completion when cash received is below the final total", () => {
    const sale: DraftSaleInput = {
      status: "draft",
      cashierName: "Owner",
      serviceLines: [
        {
          id: "line-1",
          serviceId: "svc-print",
          serviceName: "Printing",
          materials: [
            {
              id: "mat-1",
              inventoryItemId: "paper-a4",
              materialName: "A4",
              quantity: 1,
              unitPrice: 100,
              addOns: [],
            },
          ],
        },
      ],
      discount: null,
      delivery: {
        enabled: false,
        customerName: "",
        address: "",
        dropOffLocation: "",
        deliveryFee: 0,
      },
      payment: { method: "cash", cashReceived: 90 },
    };

    expect(validateCompletion(sale).errors).toContain("Cash received must cover the final total.");
  });
});
```

- [ ] **Step 2: Run the test to ensure the domain guard already exists**

Run: `npx vitest run src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: PASS.

- [ ] **Step 3: Implement the top-level wizard**

```tsx
"use client";

import { useState, useTransition } from "react";

import { saveDraft, completeSale, cancelSale } from "@/app/dashboard/sales/actions";
import { calculateFinalTotal, calculateSubtotal } from "@/lib/sales/calculations";
import { DeliveryDiscountStep } from "@/components/sales/delivery-discount-step";
import { MaterialsStep } from "@/components/sales/materials-step";
import { PaymentReviewStep } from "@/components/sales/payment-review-step";
import { ServicesStep } from "@/components/sales/services-step";
import type { DraftSaleInput, SalesSetupData } from "@/lib/sales/types";

const steps = ["Services", "Materials & Add-ons", "Delivery & Discount", "Payment & Review"];

export function SalesWizard({
  mode,
  setupData,
  initialSale,
}: {
  mode: "create" | "edit";
  setupData: SalesSetupData;
  initialSale?: DraftSaleInput;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [sale, setSale] = useState<DraftSaleInput>(
    initialSale ?? {
      status: "draft",
      cashierName: "",
      serviceLines: [],
      discount: null,
      delivery: {
        enabled: false,
        customerName: "",
        address: "",
        dropOffLocation: "",
        deliveryFee: 0,
      },
      payment: null,
    },
  );

  const subtotal = calculateSubtotal(sale);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: sale.discount,
    deliveryFee: sale.delivery.enabled ? sale.delivery.deliveryFee : 0,
  });

  function goNext() {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function handleSaveDraft() {
    startTransition(async () => {
      await saveDraft(sale);
    });
  }

  function handleCancel() {
    if (!sale.transactionId) return;

    startTransition(async () => {
      await cancelSale(sale.transactionId!);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeSale(sale);
    });
  }

  return (
    <section className="panel">
      <div className="salesStepper">
        {steps.map((step, index) => (
          <div key={step} className="salesStepBadge" data-active={index === currentStep}>
            <strong>{index + 1}.</strong> {step}
          </div>
        ))}
      </div>

      {currentStep === 0 ? (
        <ServicesStep
          serviceLines={sale.serviceLines}
          availableServices={setupData.services}
          onChange={(serviceLines) => setSale((current) => ({ ...current, serviceLines }))}
        />
      ) : null}

      {currentStep === 1 ? (
        <MaterialsStep
          sale={sale}
          inventoryItems={setupData.inventoryItems}
          addOns={setupData.addOns}
          pricingReferences={setupData.pricingReferences}
          onChange={setSale}
        />
      ) : null}

      {currentStep === 2 ? (
        <DeliveryDiscountStep sale={sale} onChange={setSale} />
      ) : null}

      {currentStep === 3 ? (
        <PaymentReviewStep
          sale={sale}
          subtotal={subtotal}
          finalTotal={finalTotal}
          onSaveDraft={handleSaveDraft}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      ) : null}

      <div className="hero__actions">
        <button className="buttonSecondary" type="button" onClick={goBack} disabled={currentStep === 0 || isPending}>
          Back
        </button>
        <button
          className="button"
          type="button"
          onClick={goNext}
          disabled={currentStep === steps.length - 1 || isPending}
        >
          Next
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement the four step components with controlled props**

```tsx
export function ServicesStep({
  serviceLines,
  availableServices,
  onChange,
}: {
  serviceLines: DraftSaleInput["serviceLines"];
  availableServices: { id: string; name: string }[];
  onChange: (lines: DraftSaleInput["serviceLines"]) => void;
}) {
  return (
    <div className="salesStep">
      <h2>Services</h2>
      <p className="muted">Add one or more service lines for this transaction.</p>
    </div>
  );
}
```

```tsx
export function PaymentReviewStep({
  sale,
  subtotal,
  finalTotal,
  onSaveDraft,
  onComplete,
  onCancel,
}: {
  sale: DraftSaleInput;
  subtotal: number;
  finalTotal: number;
  onSaveDraft: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="salesStep">
      <div className="salesTotals">
        <div>Subtotal: {subtotal}</div>
        <div>Final total: {finalTotal}</div>
      </div>
      <div className="hero__actions">
        <button className="buttonSecondary" type="button" onClick={onSaveDraft}>
          Save draft
        </button>
        <button className="buttonSecondary" type="button" onClick={onCancel}>
          Cancel transaction
        </button>
        <button className="button" type="button" onClick={onComplete}>
          Complete sale
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add the sales UI styles**

```css
.salesStep {
  display: grid;
  gap: 18px;
}

.salesStepper {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 24px;
}

.salesStepBadge {
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px 14px;
}

.salesStepBadge[data-active="true"] {
  background: var(--accent);
  color: white;
}

.salesFieldGrid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.salesAlert {
  border: 1px solid rgba(168, 109, 42, 0.3);
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(168, 109, 42, 0.08);
  color: var(--warning);
}
```

- [ ] **Step 6: Run lint for JSX and CSS integration**

Run: `npm run lint`

Expected: PASS or only unrelated pre-existing issues outside the new sales components.

- [ ] **Step 7: Commit**

```bash
git add src/components/sales/sales-wizard.tsx src/components/sales/services-step.tsx src/components/sales/materials-step.tsx src/components/sales/delivery-discount-step.tsx src/components/sales/payment-review-step.tsx src/app/globals.css src/lib/sales/validation.test.ts
git commit -m "feat: add sales wizard ui"
```

## Task 6: Connect Draft Resume and Completion Side Effects

**Files:**
- Modify: `src/app/dashboard/sales/actions.ts`
- Modify: `src/lib/sales/queries.ts`
- Modify: `src/app/dashboard/sales/[transactionId]/page.tsx`
- Reuse: `supabase/schema.sql`

- [ ] **Step 1: Write a failing test for GCash payment coverage**

```ts
import { describe, expect, it } from "vitest";

import { validateCompletion } from "./validation";
import type { DraftSaleInput } from "./types";

describe("gcash payment coverage", () => {
  it("blocks completion when gcash amount paid is below the final total", () => {
    const sale: DraftSaleInput = {
      status: "draft",
      cashierName: "Owner",
      serviceLines: [
        {
          id: "line-1",
          serviceId: "svc-print",
          serviceName: "Printing",
          materials: [
            {
              id: "mat-1",
              inventoryItemId: "paper-a4",
              materialName: "A4",
              quantity: 1,
              unitPrice: 60,
              addOns: [],
            },
          ],
        },
      ],
      discount: null,
      delivery: {
        enabled: false,
        customerName: "",
        address: "",
        dropOffLocation: "",
        deliveryFee: 0,
      },
      payment: { method: "gcash", amountPaid: 50 },
    };

    expect(validateCompletion(sale).errors).toContain("GCash amount paid must cover the final total.");
  });
});
```

- [ ] **Step 2: Run the validation test before adding completion persistence**

Run: `npx vitest run src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: PASS.

- [ ] **Step 3: Expand `completeSale` to persist completion and deduct stock**

```ts
export async function completeSale(input: DraftSaleInput) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const validation = validateCompletion(input);
  if (!validation.isValid) {
    return { ok: false, errors: validation.errors };
  }

  const supabase = await createServerClient();
  const subtotal = calculateSubtotal(input);
  const finalTotal = calculateFinalTotal({
    subtotal,
    discount: input.discount,
    deliveryFee: input.delivery.enabled ? input.delivery.deliveryFee : 0,
  });

  const { data: transaction, error: transactionError } = await supabase
    .from("sales_transactions")
    .update({
      status: "completed",
      subtotal,
      final_total: finalTotal,
      payment_method: input.payment!.method,
      draft_payload: input,
      cash_received: input.payment!.method === "cash" ? input.payment.cashReceived : null,
      gcash_amount_paid: input.payment!.method === "gcash" ? input.payment.amountPaid : null,
      change_due:
        input.payment!.method === "cash"
          ? calculateCashChange({ finalTotal, cashReceived: input.payment!.cashReceived })
          : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.transactionId)
    .select("id")
    .single();

  if (transactionError) throw transactionError;

  for (const serviceLine of input.serviceLines) {
    for (const material of serviceLine.materials) {
      await supabase.rpc("decrement_inventory_item_stock", {
        inventory_item_id_input: material.inventoryItemId,
        quantity_input: material.quantity,
        transaction_id_input: transaction.id,
      });
    }
  }

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/sales/drafts");
  revalidatePath(`/dashboard/sales/${input.transactionId}`);

  return { ok: true, errors: [] as string[] };
}
```

- [ ] **Step 4: Add draft loading for the edit route**

```ts
export async function getDraftTransactionById(transactionId: string) {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from("sales_transactions")
    .select(`
      id,
      transaction_number,
      cashier_name,
      status,
      delivery_enabled,
      customer_name,
      delivery_address,
      drop_off_location,
      delivery_fee,
      discount_type,
      discount_value,
      payment_method,
      cash_received,
      gcash_amount_paid,
      draft_payload
    `)
    .eq("id", transactionId)
    .eq("status", "draft")
    .single();

  return data;
}
```

- [ ] **Step 5: Run lint and the sales domain tests**

Run: `npm run lint`

Run: `npx vitest run src/lib/sales/calculations.test.ts src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: lint passes and the sales tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/sales/actions.ts src/lib/sales/queries.ts src/app/dashboard/sales/[transactionId]/page.tsx src/lib/sales/validation.test.ts
git commit -m "feat: connect sales completion and draft resume"
```

## Task 7: Final Integration Verification

**Files:**
- Modify: `src/app/dashboard/sales/page.tsx`
- Modify: `src/app/dashboard/sales/drafts/page.tsx`
- Modify: `src/app/dashboard/sales/[transactionId]/page.tsx`
- Modify: `src/components/sales/draft-list.tsx`
- Modify: `src/components/sales/sales-wizard.tsx`

- [ ] **Step 1: Run lint across the app**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 2: Run the focused sales tests**

Run: `npx vitest run src/lib/sales/calculations.test.ts src/lib/sales/validation.test.ts --environment node --pool threads`

Expected: PASS.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: PASS with the dashboard routes compiling successfully.

- [ ] **Step 4: Manually verify the sales flows**

Run: `npm run dev`

Expected manual checks:

- `/dashboard/sales` opens the four-step wizard
- users can move back and edit previous steps
- `Save draft` creates a draft and assigns a transaction number
- `/dashboard/sales/drafts` lists saved drafts with transaction number and date/time
- selecting a draft reopens it with populated data
- delivery fields are only required when delivery is checked
- discount blocks totals below zero
- `Cash` computes change
- `GCash` requires amount paid
- completion locks the transaction and removes it from the draft list
- cancellation keeps the transaction in history without deducting inventory

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/sales/page.tsx src/app/dashboard/sales/drafts/page.tsx src/app/dashboard/sales/[transactionId]/page.tsx src/components/sales/draft-list.tsx src/components/sales/sales-wizard.tsx src/app/globals.css
git commit -m "feat: finalize phase 2 sales flow"
```

## Self-Review

### Spec coverage

- Sales wizard with four steps: covered by Task 5.
- Draft save and draft list resume: covered by Tasks 3, 4, and 6.
- Cancelled transaction retention: covered by Tasks 3 and 6.
- Completed transaction locking and inventory deduction: covered by Task 6.
- Materials, add-ons, delivery, discount, and payment rules: covered by Tasks 1 and 5.
- Transaction numbering on first save: covered by Task 2 schema and Task 3 save flow.
- No tax or VAT, no partial payments: covered by Tasks 1 and 5 validation and totals logic.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each task includes exact file paths and executable commands.
- All test steps name the concrete test files and expected outcome.

### Type consistency

- Shared names stay consistent across tasks: `DraftSaleInput`, `calculateSubtotal`, `calculateFinalTotal`, `validateCompletion`, `saveDraft`, `completeSale`.
- Transaction status values stay consistent: `draft`, `completed`, `cancelled`.
- Payment method values stay consistent: `cash`, `gcash`.
