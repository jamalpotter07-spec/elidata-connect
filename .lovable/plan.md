## Overview

Build a full-stack web app for selling cheap MTN, Telecel, and AT data bundles via a data reseller API (mocked for now, pluggable later), with Paystack payment integration, user accounts with order history, and a full admin dashboard.

---

## Phase 1: Infrastructure & Backend Setup

1. **Enable Lovable Cloud (Supabase)**
  - Provides auth (email/password, Google), PostgreSQL database, and RLS policies.
2. **Database Schema**
  - `profiles` — linked to `auth.users`, stores display name, phone number.
  - `user_roles` — stores admin/moderator/user roles (security best practice, separate table).
  - `bundles` — data bundle catalog: name, network (MTN/Telecel/AT), data_amount (GB), price (GHS), active flag.
  - `orders` — user orders: user_id, bundle_id, recipient_phone, status (pending/paid/processing/delivered/failed), paystack_reference, amount, created_at.
  - `payments` — Paystack transaction records: order_id, reference, status, amount, metadata.
3. **RLS Policies**
  - Users can read their own profile, orders, and payments.
  - Admins can read/update all tables.
  - Public read on `bundles` (only active ones).
4. **Auth Setup**
  - Email/password + Google sign-in.
  - Auto-create `profiles` on signup via trigger.
  - `onAuthStateChange` listener at root for cache invalidation.

---

## Phase 2: Core Server Functions

1. **Bundle Functions**
  - `getBundles()` — public server fn, returns active bundles grouped by network.
  - `getBundleById(id)` — public server fn.
2. **Order Functions**
  - `createOrder(data)` — authenticated, creates a pending order.
  - `getMyOrders()` — authenticated, returns current user's order history.
  - `getOrderById(id)` — authenticated, returns order + payment details.
3. **Admin Functions**
  - `getAllOrders()` — admin-only, returns all orders with filters.
  - `getRevenueStats()` — admin-only, aggregated revenue metrics.
  - `updateBundle(id, data)` — admin-only, CRUD on bundles.
  - `createBundle(data)` — admin-only.
  - `toggleBundleActive(id)` — admin-only.
4. **Paystack Integration**
  - `initializePayment(orderId)` — server fn that calls Paystack `/transaction/initialize` with the order amount, then updates order with reference.
  - Webhook route at `/api/public/paystack/webhook` — verifies signature, updates payment + order status on success.
  - `verifyPayment(reference)` — server fn to manually verify a transaction.
5. **Data Bundle Fulfillment (Mock)**
  - `fulfillBundle(orderId)` — called after payment success, simulates API call to data reseller, updates order status to delivered/failed.
  - Designed as a pluggable adapter so the real reseller API can be swapped in later.

---

## Phase 3: Frontend Pages & Routes

### Public Pages

- `/` — Homepage: hero section, bundle catalog grouped by network (MTN/Telecel/AT), quick purchase flow.
- `/login` — Email/password + Google login.
- `/signup` — Registration.
- `/reset-password` — Password reset.

### Authenticated Pages (`/_authenticated/*`)

- `/dashboard` — User dashboard: recent orders, quick reorder, saved recipient numbers.
- `/orders` — Full order history with status tracking.
- `/orders/$orderId` — Order detail page with payment status and delivery status.

### Admin Pages (`/_authenticated/_admin/*`)

- `/admin` — Admin dashboard: revenue stats, recent orders, quick actions.
- `/admin/orders` — All orders with filtering (status, network, date range).
- `/admin/bundles` — Bundle management: create, edit, activate/deactivate bundles.
- `/admin/users` — User list with role management.

---

## Phase 4: Design & UI

- **Color palette**: Clean white backgrounds, with brand-colored accents:
  - MTN: yellow (#FFCC00)
  - Telecel: red (#E30613)
  - AT: blue (#00A4E4)
  - Primary UI: dark navy/slate for trust.
- **Typography**: Modern sans-serif (system default, clean).
- **Layout**: Responsive, mobile-first. Card-based bundle selection. Clean checkout flow.
- **Components**:
  - Network selector tabs on homepage.
  - Bundle cards with data amount, price, and "Buy Now" CTA.
  - Checkout modal: recipient phone number, confirm, then redirect to Paystack.
  - Order status badges with color coding.
  - Admin tables with sorting and filtering.

---

## Phase 5: Paystack Integration Details

- Store `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` as secrets.
- Initialize payment on the server with Paystack REST API.
- Verify webhook signature using HMAC-SHA512 with the secret key.
- On successful payment:
  1. Update payment record to `success`.
  2. Update order status to `paid`.
  3. Trigger `fulfillBundle` (mock API call).
  4. Update order to `delivered` or `failed` based on mock result.

---

## Phase 6:Data Reseller API

- Datamart gh 

---

## Phase 7: Navigation & Guards

- Root layout with navigation bar (logo, bundles, login/signup or dashboard/logout).
- `/_authenticated` layout route with `beforeLoad` auth guard.
- `/_authenticated/_admin` nested layout with role-based guard (admin only).
- Role-based access control using the `user_roles` table.

---

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite + file-based routing)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui (Radix-based)
- **Database/Auth**: Lovable Cloud (Supabase)
- **Payments**: Paystack (custom REST API integration)
- **State**: TanStack Query for server state, React hooks for local UI state
- **Validation**: Zod for forms and API inputs

---

## Files to Create/Modify

**Modified:**

- `src/routes/__root.tsx` — add auth context, nav bar, `onAuthStateChange`
- `src/router.tsx` — add auth context to router
- `src/start.ts` — add Supabase auth attacher middleware
- `src/styles.css` — add brand color tokens

**Created:**

- `src/integrations/supabase/` — client, auth middleware, auth attacher (auto-generated by Cloud enable)
- `src/routes/_authenticated.tsx` — auth layout guard
- `src/routes/_authenticated/_admin.tsx` — admin layout guard
- `src/routes/login.tsx`, `signup.tsx`, `reset-password.tsx`
- `src/routes/_authenticated/dashboard.tsx`, `orders.tsx`, `orders.$orderId.tsx`
- `src/routes/_authenticated/_admin/index.tsx`, `orders.tsx`, `bundles.tsx`, `users.tsx`
- `src/routes/api/public/paystack/webhook.ts` — Paystack webhook handler
- `src/lib/bundles.functions.ts` — bundle server functions
- `src/lib/orders.functions.ts` — order server functions
- `src/lib/payments.functions.ts` — Paystack server functions
- `src/lib/admin.functions.ts` — admin server functions
- `src/lib/reseller-api.ts` — mock reseller API adapter
- `src/components/` — bundle cards, network tabs, checkout modal, order status badge, admin tables, nav bar

---

## Risk & Notes

- Paystack is not a Lovable built-in provider, so the full REST API integration must be built manually. Webhook signature verification is critical.
- The real data reseller API is unknown; the mock layer must be clearly documented for easy replacement.
- Admin dashboard requires `user_roles` table and a security-definer `has_role` function for safe RLS.
- All server functions that touch payments or admin data must validate inputs with Zod.