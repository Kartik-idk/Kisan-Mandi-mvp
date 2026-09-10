# Architecture & System Design

**Analysis Date:** 2026-09-10

## Architectural Pattern
- **Pattern:** Role-Centric Client-Driven Single Page Applications (SPA) with Serverless API Handlers under Next.js App Router.
- **Data Flow:** Direct real-time and polling queries from React client components to Supabase PostgreSQL database tables using the Supabase client SDK.

## Key Layers & Subsystems
1. **Authentication & Session Routing (`src/app/page.tsx`):**
   - Role-specific local storage token isolation (`mandi_user_farmer`, `mandi_user_agent`, `mandi_user_merchant`, `mandi_user_palledar`, `mandi_user_manager`) preventing cross-tab collision.
   - Guard redirects checking user role validity on mount.

2. **Role Dashboards:**
   - **Farmer Portal (`src/app/farmer/page.tsx`):** Mobile-first UI for lot tracking, digital receipts (J-Forms), disputes, and market prices with multi-language (EN, HI, KN) support.
   - **Agent Portal (`src/app/agent/page.tsx`):** Desktop-oriented operations console for lot registration, weighment, quality grading, auction completion, and dispatch.
   - **Merchant Portal (`src/app/merchant/page.tsx`):** Marketplace for reviewing available lots, placing bids, managing purchases, and requesting dispatches.
   - **Palledar Portal (`src/app/palledar/page.tsx`):** Task management for laborers to start/complete loading and unloading tasks and track wage payouts.
   - **Manager Command Center (`src/app/manager/page.tsx`):** Executive overview of mandi operations, KPIs, charts, live transaction ledger, and dispute investigation.

3. **Shared Components & Services:**
   - `PriceHistory.tsx`: Calculates statistical aggregates (avg, min, max, spread) for crop commodities.
   - `Toast.tsx`: Visual feedback notifications.

<!-- refreshed: 2026-09-10 -->
*Codebase architecture analysis: 2026-09-10*
