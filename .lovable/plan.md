## What's already in place

All code-side features from your history are present in this remix:

- **Public routes**: `/`, `/about`, `/privacy`, `/terms`, `/login`, `/signup`, `/reset-password`, `/track/$orderId`
- **User routes**: `/dashboard`, `/orders`, `/orders/$orderId`
- **Admin pages** under `/_authenticated/_admin/`: dashboard (`admin.index`), bundles CRUD (`admin.bundles`), orders list (`admin.orders`), order detail (`admin.orders_.$orderId`), users + role management (`admin.users`)
- **Server functions**: `bundles`, `orders`, `checkout`, `admin`, plus `reseller.server` (Mobigh) and `sms.server` (Arkesel)
- **Secrets**: `ARKESEL_API_KEY`, `PAYSTACK_SECRET_KEY`, `MOBIGH_API_KEY` were just added
- **Database**: `profiles`, `bundles`, `orders`, `payments`, `user_roles` tables with RLS + `has_role` function + signup trigger

## What's missing in the remix

The remix copied schema but not data — `bundles`, `orders`, and `user_roles` are all empty. That means:

1. Homepage shows no bundles to buy
2. No admin user exists, so `/admin/*` is inaccessible to anyone

## Plan

### 1. Re-seed the bundle catalog
Run a migration to insert the 10 sample bundles (MTN, Telecel, AT) with the same names/prices/cost prices used in the original project, so the catalog and admin profit calculations work immediately.

### 2. Admin bootstrap instructions
After you sign up your own account on the live preview, I'll give you a one-line SQL `insert into user_roles (user_id, role) values ('<your-uid>', 'admin')` to grant yourself admin access. (Can't do this before the account exists.)

### 3. Verify Paystack wiring
Your original plan had Paystack as a stub. Now that `PAYSTACK_SECRET_KEY` is set, confirm whether you want me to:
   - **(a)** Leave the test-checkout stub in place until Paystack approves your account, or
   - **(b)** Swap the stub for real Paystack `/transaction/initialize` + add the `/api/public/paystack/webhook` route with HMAC verification right now

### 4. Confirm reseller + SMS go-live
Both `MOBIGH_API_KEY` and `ARKESEL_API_KEY` are set, so `reseller.server.ts` and `sms.server.ts` will start hitting real APIs the moment an order is paid. No code change needed — just flagging it so you're aware test orders will consume real credits.

## Questions before I implement

- Confirm Paystack option **(a)** vs **(b)** above.
- Should I also seed any orders/users for testing, or leave those empty?

Reply with your choices and I'll switch to build mode.