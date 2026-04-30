# Phase 2 Sales Flow Design

Date: 2026-04-30
Topic: Phase 2 sales flow, drafts, payment, delivery, and inventory deduction behavior

## Goal

Phase 2 introduces the operational sales flow for printing-related transactions. The system must support multi-line service sales, material selection, add-ons, delivery, transaction-level discounts, payment capture, draft recovery, and stock deduction on completion.

This phase should prioritize the sales entry experience before any file import work from `service-details`.

## Scope

Phase 2 covers:

- sales entry through a step-by-step wizard
- persistent draft transactions that can be resumed later
- cancelled transactions retained in history
- completed transactions locked after save
- service lines with one or more selected materials
- optional add-ons tied to selected materials
- suggested pricing based on existing `service-details` data
- manual pricing override by staff
- optional transaction-level discounts
- optional delivery details and delivery fee
- payment capture for `Cash` and `GCash`
- stock warnings during sale entry
- inventory deduction only when a sale is completed

Phase 2 does not include:

- tax or VAT logic
- selling prices stored on inventory items
- imported `service-details` management as the first implementation target

## Core Domain Decisions

- `services`, `add-ons`, and `inventory items` are managed as separate lists.
- Staff choose the material during the sale.
- Add-ons are selected independently on a sale.
- Every paper and laminating sheet is tracked per sheet.
- Stock can be entered even without a supplier selected.
- Inventory items do not store selling price.
- Cost-per-sheet tracking has its own separate dashboard.
- Services do not carry a final price by themselves.
- Final service pricing is determined only after material selection.
- The system suggests a selling price after material selection using pricing data from `service-details`.
- Staff can override the suggested price.
- Services and add-ons use `active/inactive` rather than hard delete.
- One service line supports multiple materials.
- Add-ons are optional.
- Add-ons should multiply by quantity.
- Add-ons should support different quantities per material.
- Phase 2 inventory only includes materials used in services.
- Low stock should warn but not block the sale.

## High-Level Structure

Phase 2 uses a single persistent transaction model plus two operational sales surfaces:

- `Sales Entry Wizard` for creating a new transaction or resuming an existing draft
- `Draft List` for finding and reopening saved drafts

The transaction model must support these statuses:

- `draft`
- `completed`
- `cancelled`

The same transaction record moves through those statuses over time.

## Transaction Lifecycle

### New Transaction

A new transaction starts in the wizard before it has a transaction number. The transaction number is assigned only when the transaction is first persisted as either `draft` or `completed`.

### Draft

A draft is a saved in-progress transaction:

- it remains fully editable
- it can be resumed later from the draft list
- all previously entered details remain populated when reopened
- saving as draft does not deduct inventory

### Cancelled

A cancelled transaction is retained in history:

- cancellation marks the transaction as `cancelled`
- cancelled transactions are not deleted
- cancellation does not deduct inventory

### Completed

A completed transaction is finalized:

- it becomes locked from further edits
- it deducts inventory at the time of completion
- payment must cover the full final total before completion is allowed

## Wizard Steps

The sales entry screen uses a four-step wizard.

### Step 1: Services

The user:

- starts a transaction
- adds one or more service lines
- defines which service is being availed on each line

Rules:

- at least one service line is required to complete the sale
- only active services should be available for new selection

### Step 2: Materials and Add-ons

For each service line, the user:

- selects one or more materials
- enters quantity for each selected material
- optionally selects add-ons for each material
- enters add-on quantity per material as needed

Rules:

- selected materials are required for each service line before completion
- add-ons are optional
- add-ons are attached to the sale flow independently from the base service definition
- add-on quantity can differ per material
- low-stock warnings should be shown when relevant, but the sale must still be allowed

### Step 3: Delivery and Discount

The user can optionally enable delivery using a checkbox.

If delivery is enabled, these fields become required:

- customer name
- address
- drop-off location
- delivery fee

Delivery fee is manually entered because the business uses an external site to determine it.

The same step also allows an optional transaction-level discount. Discount entry supports:

- fixed amount
- percentage

Validation rule:

- the system must block a discount that would push the total below zero
- there is no separate maximum discount limit beyond that rule

### Step 4: Payment and Review

The user:

- selects a payment method from a dropdown
- reviews computed totals
- saves as draft, cancels, or completes the sale

Payment methods:

- `Cash`
- `GCash`

For `Cash`, the form requires:

- cash received
- computed change

For `GCash`, the form requires:

- amount paid

Rules:

- payment method is required for completion
- payment must cover the full final total before completion
- no partial-payment behavior is included in Phase 2

## Navigation and Editing Behavior

- users can move back to previous steps and edit them freely
- changes on earlier steps must recalculate totals and dependent values
- resumed drafts open in the same wizard and remain fully editable
- completed transactions are locked

## Pricing and Totals

### Suggested Pricing

After materials are selected, the system should automatically suggest pricing from the existing `service-details` reference.

Staff can override the suggested price.

### Subtotal

Subtotal should reflect:

- selected services as priced through material-based pricing
- add-ons
- overridden values when staff changes suggested pricing

### Discount

Discount is:

- optional
- applied to the whole transaction only
- entered as either fixed amount or percentage

### Delivery Fee

Delivery fee:

- is optional overall
- is included only when delivery is enabled
- is manually entered

### Final Total

Final total is:

`subtotal - discount + delivery fee`

There is no tax or VAT logic in Phase 2.

## Required Saved Data

The minimum saved transaction data should include:

- auto-generated transaction number once first saved
- date/time
- cashier or staff identifier
- status
- service lines
- selected materials per service line
- optional add-ons
- subtotal
- optional transaction-level discount
- optional delivery details when delivery is enabled
- payment method
- payment values
- final total

Conditional requirements:

- customer name is only required for delivery transactions
- delivery details are only required when delivery is checked
- payment values depend on the selected payment method

## Draft List

Phase 2 includes a draft list for reopening saved drafts.

The draft list only needs to display:

- transaction number
- date/time created

Selecting a draft should reopen it in the sales entry wizard with all stored values populated.

## Save and Validation Rules

### Save as Draft

Saving as draft:

- persists the transaction even if later-step data is incomplete
- assigns a transaction number on the first save
- keeps entered values for later resume

### Complete Sale

Completing a sale requires:

- at least one service line
- selected materials for each service line
- all required delivery fields if delivery is enabled
- payment method
- payment coverage equal to or greater than the final total
- all other required fields needed for a valid completed transaction

When completion succeeds:

- status becomes `completed`
- inventory is deducted
- the transaction becomes locked

### Cancel Transaction

Cancelling a transaction:

- updates the status to `cancelled`
- keeps the transaction in history
- does not deduct inventory

## Inventory Rules

- Phase 2 inventory only tracks materials used in services
- stock warnings should appear when stock is too low
- stock warnings do not block a sale
- inventory is deducted only when the sale is completed
- drafts and cancelled transactions do not deduct inventory

## Initial Build Order

The first Phase 2 screen to build should be the sales entry screen.

File import from `service-details` should be deferred until after the sales screens are built.

## Implementation Boundaries

To keep Phase 2 focused:

- do not introduce tax/VAT behavior
- do not add partial payments
- do not allow edits after completion
- do not move discount logic down to service-line or material-entry level
- do not expand the draft list beyond the minimum required columns unless a later phase needs it

## Open Assumptions Locked For Phase 2

These decisions are considered final for this phase unless explicitly changed later:

- transaction numbers use a simple incremental format
- transaction numbers are assigned only on first persisted save
- delivery is an optional step controlled by a checkbox
- discounts are optional and transaction-level only
- discounts may be amount or percentage
- completed transactions are locked
- cancelled transactions remain in history
- drafts are resumable later from a draft list
