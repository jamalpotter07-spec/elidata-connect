## Goal

Ship a fully working site **without Paystack live keys** so you can submit it for Paystack approval. Payments will be stubbed with a clearly-marked "Test checkout" flow that simulates success and triggers the same downstream logic. When Paystack approves your account, we swap in the real init + webhook in one focused turn.

## What gets built now

### Database (already done ✓)
- `profiles`, `user_roles`, `bundles`, `orders`, `payments` tables
- RLS policies, `has_role` security-definer function
- Auto-create profile + 'user' role trigger on signup
- 10 seeded sample bundles (MTN, Telecel, AT)

### Authentication
- Email/password + Google sign-in (Lovable Cloud managed)
- Login, signup, reset-password pages
- Root-level `onAuthStateChange` for cache invalidation
- Auth context wired into the router

### Routes
- `/` — homepage with hero + bundle catalog (network tabs: MTN/Telecel/AT)
- `/login`, `/signup`, `/reset-password`
- `/_authenticated/dashboard` — recent orders + quick reorder
- `/_authenticated/orders` — full order history
- `/_authenticated/orders/$orderId` — order detail
- `/_authenticated/_admin` — admin layout (role-gated)
- `/admin` — revenue + recent orders dashboard
- `/admin/orders` — all orders, filterable
- `/admin/bundles` — CRUD bundles, toggle active
- `/admin/users` — view users, grant/revoke admin role

### Server functions
- `bundles.functions.ts` — list active bundles
- `orders.functions.ts` — create order, list my orders, get order
- `admin.functions.ts` — all orders, stats, bundle CRUD, role management
- `checkout.functions.ts` — **stub** that marks order paid and fulfills (mock). Clearly labeled `TODO: replace with Paystack init` so swap-in is one edit.
- `reseller.ts` — adapter for Datamart GH. Currently returns simulated success/failure after a delay; structured so the real Datamart API call replaces only the inside of one function.

### Checkout flow (interim)
1. User picks bundle → enters recipient phone → confirms.
2. Order created with `status: pending`.
3. "Test checkout" button calls stub fn → marks order `paid`, triggers mock reseller fulfillment → order becomes `delivered`.
4. A visible banner on the checkout page says **"Payments in test mode — real card payments unlock once Paystack approves the account."**

### Admin bootstrap
After you sign up, you'll grant yourself the `admin` role via a one-line SQL insert (I'll provide the exact command in the chat once your user exists).

### Design
- Clean white/slate base
- Brand accents: MTN yellow `#FFCC00`, Telecel red `#E30613`, AT blue `#00A4E4`
- Mobile-first card grid, responsive nav
- Status badges color-coded

## What's deferred to "after Paystack approval"

A single follow-up turn will:
1. Add `PAYSTACK_SECRET_KEY` secret
2. Replace the `checkout` stub with real Paystack `/transaction/initialize` call
3. Add `/api/public/paystack/webhook` route with HMAC signature verification
4. Remove the test-mode banner

That's it — everything else stays untouched.

## Files to create

**Server**
- `src/lib/bundles.functions.ts`
- `src/lib/orders.functions.ts`
- `src/lib/admin.functions.ts`
- `src/lib/checkout.functions.ts` (stub)
- `src/lib/reseller.ts` (Datamart adapter, currently mocked)

**Routes**
- `src/routes/_authenticated.tsx`, `_authenticated/dashboard.tsx`, `_authenticated/orders.tsx`, `_authenticated/orders.$orderId.tsx`
- `src/routes/_authenticated/_admin.tsx`, `_admin/index.tsx`, `_admin/orders.tsx`, `_admin/bundles.tsx`, `_admin/users.tsx`
- `src/routes/login.tsx`, `signup.tsx`, `reset-password.tsx`
- Rewrite `src/routes/index.tsx`, `src/routes/__root.tsx`

**Components**
- Nav bar, bundle card, network tabs, checkout dialog, order status badge, admin tables

**Modified**
- `src/router.tsx` — add auth context
- `src/start.ts` — add `attachSupabaseAuth` middleware
- `src/styles.css` — brand color tokens

## Confirm to proceed

Reply "go" and I'll build everything in the next turn. The site will be fully usable end-to-end with the test checkout, ready to share with Paystack as proof.