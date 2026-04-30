# Phase 2 Planning Notes

## Purpose

This file captures the Phase 2 planning decisions and the next unanswered question so planning can resume later without losing context.

## Confirmed Decisions

- `services`, `add-ons`, and `inventory items` will be treated as three separate managed lists.
- Staff should choose the material during the sale.
- Add-ons are selected independently on a sale.
- Every paper and laminating sheet is tracked per sheet.
- Staff can enter stock even if no supplier is selected.
- Inventory items should not store selling price.
- There will be a separate dashboard for cost per sheet.
- Services do not carry a final price by themselves.
- Final service pricing is determined after staff picks a material.
- The system should automatically suggest a selling price after material selection using the pricing data from `service-details`.
- Staff can override the suggested price.
- Services and add-ons should use `active/inactive` instead of hard delete.
- One service line should support multiple materials inside it.
- Add-ons should be selectable in the UI as a checkbox or button.
- Add-ons should multiply by quantity.
- Add-ons should support different quantity per material.
- Phase 2 inventory should only include materials used in services.
- If stock is too low, the system should warn staff but still allow the sale.
- Build the screens first before implementing file import from `service-details`.
- The first Phase 2 screen to build should be the sales entry screen.
- The sales entry screen should use a step-by-step flow.
- One transaction should support multiple service lines.
- Payment should be collected in the same flow.

## Current Phase 2 Shape

The sales flow currently implied by the planning is:

1. Start a transaction
2. Add one or more service lines
3. For each service line, choose one or more materials
4. For each material, enter quantity
5. For each material, optionally select add-ons
6. Auto-fill suggested pricing from the existing pricing reference
7. Allow staff to override suggested pricing
8. Show stock warnings if needed, but do not block the sale
9. Review totals
10. Collect payment in the same flow
11. Save the completed sale and deduct stock

## Outstanding Question

The next unanswered planning question is:

Do you want discounts in Phase 2, and if yes, should they apply per service line, per material entry, or to the whole transaction only?

## Likely Next Questions After That

- Should delivery be part of the same checkout step or an optional details step before payment?
- What exact payment fields are needed for `Cash` and `GCash`?
- Do we need change calculation for cash payments in Phase 2?
- Should draft/cancel behavior exist inside the step-by-step sale flow?
- What is the minimum data needed on the final saved sale record?
