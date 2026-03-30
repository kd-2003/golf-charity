# Golf Charity Subscription Platform (MERN, JavaScript)

Full-stack MERN implementation based on the provided PRD:
- JWT auth with user/admin roles
- Subscription-gated score entry (last 5 scores, auto-rollover)
- Charity listing and user charity percentage
- Monthly draw engine (random + algorithmic simulation)
- Prize pool split with 5-match rollover support
- Winner proof submission and admin review endpoints
- User dashboard + admin dashboard (including subscription toggle)
- Stripe checkout session, Customer Portal (manage/cancel), and webhooks

## Tech Stack
- Frontend: React + Vite + React Router + Axios
- Backend: Node.js + Express + MongoDB + Mongoose
- Auth: JWT + bcryptjs

## Project Structure
- `server/` Express API and business logic
- `client/` React app (public pages + user/admin screens)

## Setup
1. Install dependencies:
   - `npm install`
2. Configure env files:
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.example` to `client/.env`
3. Start both apps:
   - `npm run dev`
4. Seed sample data:
   - `npm run seed`

## Default API Base URLs
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## Implemented PRD Highlights
- User roles: visitor, subscriber, admin
- Scores: Stableford 1-45, each with date, latest 5 retained
- Draw operations:
  - Simulate (admin), save **draft** (simulation stored, unpublished), **publish** official results (admin)
  - Jackpot carry-in from previous month when no 5-match winner
  - Public `GET /api/draws` (published only), `GET /api/draws/upcoming`
- Admin operations:
  - Dashboard analytics summary
  - User management endpoints + activate/deactivate subscription
  - Winner proof review
- Charity operations:
  - Public list with search
  - Admin create/edit/delete

## Stripe configuration (required for real payments)

1. In the [Stripe Dashboard](https://dashboard.stripe.com), create two **recurring Prices** (monthly and yearly) and copy their Price IDs (`price_...`).
2. Copy `server/.env.example` to `server/.env` and set:
   - `STRIPE_SECRET_KEY` — Secret key from Developers → API keys
   - `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID` — from Products → Prices
   - `STRIPE_WEBHOOK_SECRET` — from a webhook endpoint (see below)
3. **Customer Portal** (cancel / update payment method): In Stripe → **Settings → Billing → Customer portal**, enable the portal and save. Users must complete Stripe Checkout once so `stripeCustomerId` is stored; then **Manage or cancel subscription** on the dashboard opens the portal.
4. **Local webhooks:** Install [Stripe CLI](https://stripe.com/docs/stripe-cli), then run:
   - `stripe listen --forward-to localhost:5000/api/billing/webhook`
   - Paste the CLI’s `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` in `server/.env`.
5. Production: add the same URL in Stripe Dashboard → Webhooks → `https://your-api-domain/api/billing/webhook` and use that endpoint’s signing secret.

**API routes**

- `POST /api/billing/checkout-session` — starts Checkout (authenticated)
- `POST /api/billing/portal-session` — opens Customer Portal (authenticated, requires `stripeCustomerId`)
- `POST /api/billing/webhook` — Stripe events (raw body; do not call from the browser)

**Seeded credentials**

- Admin: `admin@golfcharity.com` / `Admin@123`
- User: `aman@example.com` / `User@123`
