# Billing Setup Guide

ByteBoundless uses Stripe for all payment handling: subscription signups
(Pro, Agency), one-time overage credit purchases, and self-service
cancellation via the Stripe Customer Portal.

The code is already wired up. This doc covers the one-time dashboard
configuration you need to do in Stripe before the integration works, plus
how to test it and what to expect during beta.

## Architecture overview

```
User clicks "Upgrade to Pro"
  → POST /api/billing/subscribe
  → Creates Stripe Checkout session (mode: subscription)
  → Redirects to checkout.stripe.com
  → User completes payment
  → Stripe fires checkout.session.completed + customer.subscription.created
  → /api/billing/webhook verifies signature, dispatches to handler
  → Profile.plan flips to 'pro' + stripe_subscription_id set
```

```
User clicks "Manage Billing" or "Downgrade"
  → POST /api/billing/portal
  → Creates Stripe Billing Portal session
  → Redirects to billing.stripe.com
  → User cancels / updates payment method / changes plan
  → Stripe fires customer.subscription.updated (then .deleted on period end)
  → Webhook processes, profile updates
```

```
User buys 200 extra results
  → POST /api/billing/checkout (mode: payment)
  → Redirects to checkout.stripe.com
  → User completes payment
  → Stripe fires checkout.session.completed (mode: payment)
  → Webhook credits overage_credits + records overage_purchase
```

All three flows are live in the codebase. The only thing you need to do
before any of them work in production is the dashboard setup below.

## One-time Stripe dashboard setup

### 1. Create products and prices

You need two recurring products for subscriptions and the overage credits
are configured inline at checkout (no product needed in the dashboard for
that flow).

**Pro subscription:**
1. https://dashboard.stripe.com/products → Add product
2. Name: `ByteBoundless Pro`
3. Pricing model: Recurring
4. Price: $29.00 / month
5. Save → copy the price ID (`price_...`) from the product detail page
6. Add to env as `STRIPE_PRO_PRICE_ID`

**Agency subscription:**
1. Same flow
2. Name: `ByteBoundless Agency`
3. $79.00 / month recurring
4. Add the price ID to env as `STRIPE_AGENCY_PRICE_ID`

Repeat both in **test mode** (`dashboard.stripe.com/test/products`) with
separate test price IDs for local dev. See `supabase/email-templates/README.md`
for the test mode vs live mode split if you need a refresher.

### 2. Configure the Customer Portal

The Billing Portal is a Stripe-hosted page that handles subscription
management. ByteBoundless opens it from the Settings → Billing section
when a user clicks "Manage Billing" or "Downgrade."

1. https://dashboard.stripe.com/settings/billing/portal (live mode)
   https://dashboard.stripe.com/test/settings/billing/portal (test mode)
2. Under **Features**, enable:
   - [x] Customer information (update email, name, billing address)
   - [x] Payment methods (update card)
   - [x] Invoice history
   - [x] Cancel subscriptions → set cancellation mode to "At end of billing period"
     (users keep access until their current period ends)
   - [x] Subscription cancellations → optional: configure retention reasons + flows
   - [x] Subscription updates (let users switch between Pro and Agency directly in the portal)
     - Click "Customize" → add both Pro and Agency products as allowed switch targets
3. Under **Business information**, set:
   - Privacy policy URL: `https://byteboundless.com/privacy`
   - Terms of service URL: `https://byteboundless.com/terms`
4. Under **Default redirect link**, it doesn't matter — our portal session
   sets its own `return_url` via the API
5. Click **Save changes**

Repeat in test mode separately.

### 3. Configure the webhook endpoint

For each environment where webhooks should fire:

**Production (live mode):**
1. https://dashboard.stripe.com/webhooks → Add endpoint
2. Endpoint URL: `https://byteboundless.com/api/billing/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Save → click the endpoint → **Signing secret** → reveal → copy
5. Add as `STRIPE_WEBHOOK_SECRET` to Vercel production env

**Test mode — local dev:**
Don't create a dashboard webhook. Use the Stripe CLI instead:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```
The CLI prints a `whsec_...` signing secret — add it to `.env.local` as
`STRIPE_WEBHOOK_SECRET`.

**Test mode — Vercel preview (optional):**
Only if you want preview deployments to receive real test-mode events.
Create a test-mode webhook endpoint pointing at your preview URL and use
its signing secret in the Preview environment on Vercel.

### 4. Set all the environment variables

| Variable | Where it comes from |
|---|---|
| `STRIPE_SECRET_KEY` | Developers → API keys (`sk_live_...` in production, `sk_test_...` in test) |
| `STRIPE_WEBHOOK_SECRET` | Your webhook endpoint's signing secret (`whsec_...`) |
| `STRIPE_PRO_PRICE_ID` | The price ID for Pro from step 1 |
| `STRIPE_AGENCY_PRICE_ID` | The price ID for Agency from step 1 |
| `NEXT_PUBLIC_SITE_URL` | Your production URL — used for portal return URLs. Optional but recommended. Falls back to `Origin` header if unset. |

Set all of these on Vercel production (and `.env.local` for local dev with
test-mode values).

## Testing the full flow

Once everything's configured, run through this end-to-end:

### Subscription checkout

1. Run `npm run dev` locally with test-mode env vars
2. In another terminal: `stripe listen --forward-to localhost:3000/api/billing/webhook`
3. Log in as a test user with plan=`free`
4. Navigate to Settings → Billing
5. Click "Upgrade" next to Pro
6. You're redirected to Stripe Checkout — use card `4242 4242 4242 4242`, any
   future expiry, any CVC, any ZIP
7. Complete payment → you're redirected to `/settings?subscribe=success&plan=pro`
8. Watch the `stripe listen` terminal — you'll see `checkout.session.completed`
   and `customer.subscription.created` fire in sequence
9. Refresh Settings → Billing — your plan should now show "Pro"
10. In Supabase, verify `profiles.plan = 'pro'` and `profiles.stripe_subscription_id` is set

### Cancellation

1. As the same user now on Pro, click "Manage Billing" (or "Downgrade" next to Free)
2. You're redirected to the Stripe Billing Portal
3. Click "Cancel subscription" → confirm
4. Stripe marks the subscription with `cancel_at_period_end: true`
5. You'll see `customer.subscription.updated` fire in the listen terminal
6. Back in Settings, your plan still shows "Pro" — correct, you keep access
   until the period ends
7. In Stripe Dashboard → Subscriptions, you'll see the sub marked "Canceled"
   but active until its period end date
8. To test the final revert: use Stripe CLI to advance the clock or manually
   trigger `customer.subscription.deleted`:
   ```bash
   stripe trigger customer.subscription.deleted
   ```
9. Watch for the webhook to fire — `profiles.plan` should flip back to `'free'`

### Overage credit purchase

1. As a paid user, click "Buy 200 Extra Results — $4" under the usage stats
2. Redirected to Stripe Checkout (mode: payment this time, not subscription)
3. Pay with test card
4. Back at `/settings?purchase=success`
5. Webhook fires `checkout.session.completed` (mode: payment)
6. Your `profiles.overage_credits` should be `+200` and a new row appears in
   `overage_purchases` with the session ID

## What the webhook handles for you

All of this happens automatically via `/api/billing/webhook` — you never
have to touch the code for these flows:

| Event | What we do |
|---|---|
| `checkout.session.completed` (mode=payment) | Credit `overage_credits`, insert `overage_purchases` row (idempotent via session ID) |
| `checkout.session.completed` (mode=subscription) | Retrieve subscription, set `profiles.plan` + `profiles.stripe_subscription_id`, clear `plan_expires_at` (beta overrides) |
| `customer.subscription.created` | Same as above — redundant path for safety |
| `customer.subscription.updated` | Remap plan from the current price ID. Status `active` or `trialing` → set plan; `past_due` → grace window, keep plan; `canceled` / `incomplete_expired` / `unpaid` → revert to free |
| `customer.subscription.deleted` | Revert plan to free, clear `stripe_subscription_id` |
| `invoice.payment_failed` | Logged only — `customer.subscription.updated` with `past_due` status handles the state transition |

Every event is signature-verified via the Stripe SDK, and the event ID is
inserted into `stripe_webhook_events` for idempotency. Duplicate events
(Stripe retries on non-2xx responses) are safely skipped.

## Beta caveat

During the beta, plan to grant access manually via the admin panel's
"Grant Beta 30d" button — this sets `plan = 'agency'` with
`plan_expires_at = now + 30 days` and doesn't touch Stripe at all. No real
payment is collected.

When you're ready to charge real money, turn on the live-mode webhook,
add the live-mode env vars to Vercel, and the existing code starts
processing real subscriptions without any changes.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "No Stripe customer found" when clicking Manage Billing | User signed up before any billing flow ran | Have them start a checkout (even canceled) once — that creates the customer |
| Upgrade button returns 503 | `STRIPE_SECRET_KEY` not set | Check Vercel env vars |
| Subscription success but plan stayed free | Webhook signature verification failed | Check `STRIPE_WEBHOOK_SECRET` matches the one shown in the webhook endpoint's Signing secret field. Stripe dashboard shows failed webhook deliveries with the verification error. |
| Plan change in portal didn't reflect in app | Webhook didn't fire or handler errored | Check `stripe_webhook_events` table for the event ID; check Sentry for handler failures |
| Portal session creation fails with "No configuration" | Customer Portal not configured in Stripe dashboard | Complete step 2 above |
| Can't switch plans from the portal | "Subscription updates" feature not enabled | Portal settings → enable it and add both products as allowed targets |
