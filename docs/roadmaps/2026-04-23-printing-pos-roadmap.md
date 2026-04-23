# Printing POS Roadmap

## Summary

This roadmap covers the first planned version of the printing business POS system based on the current decisions:

- Single-shop setup
- Job-order based sales flow
- Mostly fixed prices with editable service lines for special cases
- Inventory linked to sales and reduced automatically on completed transactions
- Optional customer details only for deliveries
- Cash and GCash payments
- On-screen sales records only
- Supplier purchase tracking and manual stock adjustments
- Low-stock warnings when remaining stock falls below 10%
- Web app deployed on Vercel
- Google OAuth with whitelisted email access
- Online-only operation for v1

Current source files in `service-details` show sample catalog data such as:

- Services: `Standard Printing A4`, `Photoprint A4`, `Design A4`, `laminate A4`, `photocopy colored`
- Add-ons: `Editing`, `Shipping`
- Materials: `A4 Bond Paper`, `RC Photopaper A4`, `Laminating Film A4`, `Short bondpaper`, `Long bondpaper`

## Phase 1: Foundation

Goal: establish the core app architecture and secure access.

- Choose a Vercel-friendly stack for frontend, backend, database, and auth
- Set up the project structure and environment configuration
- Implement Google OAuth login
- Restrict access to whitelisted email addresses
- Define the core database models for:
  - services
  - add-ons
  - inventory items
  - suppliers
  - purchases
  - sales
  - sale line items
  - stock movements

## Phase 2: Catalog And Inventory Setup

Goal: make services, materials, and stock manageable before sales go live.

- Build catalog management for services and add-ons
- Store fixed pricing for common services and add-ons
- Support editable pricing for exceptions such as editing charges
- Build inventory item management with units, stock counts, and cost values
- Add supplier management
- Add purchase entry so stock increases from supplier restocks
- Add manual stock adjustment for corrections, spoilage, or damaged stock
- Implement low-stock logic using the less-than-10-percent threshold

## Phase 3: POS Sales Flow

Goal: support real job-order transactions from creation to completion.

- Build the main POS screen for printing jobs
- Let staff select a service, quantity, materials, and add-ons
- Support fixed-price services and editable service lines where needed
- Support add-ons like editing, laminating, and manually entered delivery fee
- Support payment methods: `Cash` and `GCash`
- Finalize a sale in one flow
- Show the completed transaction on screen
- Deduct material usage automatically from inventory when a sale is completed

## Phase 4: Delivery Support

Goal: support delivery-related sales without overcomplicating customer management.

- Keep customer fields optional for regular walk-in transactions
- Require or show customer details only when delivery is used
- Store delivery information on the sale record
- Keep the delivery fee as a manual input from your existing website calculator result

## Phase 5: Reporting Dashboard

Goal: give visibility into daily operations and stock status.

- Daily sales report
- Top-selling items and services
- Current inventory report
- Low-stock report
- Purchase history report
- Sales history with useful date-based filtering

## Phase 6: Profitability Dashboard

Goal: track markup, margin, and cost visibility in a separate dashboard.

- Add a markup calculator
- Add a margin calculator
- Show cost versus selling price where cost data is available
- Provide a profitability view for products and services

## Phase 7: Hardening And Deployment

Goal: prepare the app for stable real-world use.

- Import or encode the existing service and pricing data from `service-details`
- Validate stock deduction rules using real transaction scenarios
- Add stock movement history for review and troubleshooting
- Test authentication, sales, inventory, purchases, and reporting flows
- Deploy the app to Vercel with production configuration

## Recommended Build Order

1. Foundation
2. Catalog and inventory
3. POS checkout and sales flow
4. Supplier purchases and restocking
5. Reporting dashboard
6. Profitability dashboard
7. Deployment and stabilization

## V1 Scope Recommendation

Keep v1 focused on the core system:

- Shared authenticated interface
- Service and add-on catalog
- Inventory deduction on sale completion
- Supplier purchases and stock adjustments
- Reports
- Profitability dashboard

Avoid these in v1 unless requirements change:

- Offline mode
- Printed receipts
- Multi-branch support
- Separate staff role screens
- Built-in delivery fee calculator

## Next Planning Step

The next document should be a detailed technical specification covering:

- pages and screens
- database tables and relationships
- exact order flow
- inventory deduction rules
- reporting logic
- profitability calculations
