# External Integrations & Services

**Analysis Date:** 2026-09-10

## Database & Authentication
- **Service:** Supabase (PostgreSQL BaaS)
- **Client Library:** `@supabase/supabase-js` via `src/lib/supabase.ts`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Tables Used:**
  - `users`: User profiles with roles (`FARMER`, `AGENT`, `MERCHANT`, `PALLEDAR`, `MANAGER`), names, and phone numbers.
  - `lots`: Crop inventory records with status (`ARRIVED`, `WEIGHED`, `AUCTIONED`, `DISPATCHED`), weights, grades, and foreign keys.
  - `bids`: Merchant bids placed on lots.
  - `transactions`: Auction settlement records and digital receipts.
  - `work_tasks`: Palledar labor tasks (`LOADING`, `UNLOADING`, `SORTING`, `WEIGHING`) and wage payment statuses.
  - `disputes`: Conflict reports on weights, quality, and payment.

## SMS / OTP Provider
- **Mechanism:** Mock client-side OTP flow for hackathon demonstration.

## Hosting & Deployment
- **Platform:** Vercel
- **Continuous Deployment:** Connected via GitHub repository `https://github.com/Kartik-idk/Kisan-Mandi-mvp.git` on `main` branch.

<!-- refreshed: 2026-09-10 -->
*Codebase integrations analysis: 2026-09-10*
