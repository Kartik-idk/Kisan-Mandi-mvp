# Kisan Mandi MVP

> A role-based digital mandi workflow for tracking agricultural lots from arrival through auction, settlement, and dispatch.

[Live demo](https://kisan-mandi-mvp.vercel.app)

Kisan Mandi MVP models the day-to-day coordination of a wholesale agricultural market. It gives farmers, agents, merchants, labourers, and managers focused views of the same lot lifecycle—making the market process easier to follow and audit.

## What it demonstrates

- **Farmer workflow:** track lots and their progress through the market.
- **Agent workflow:** support intake, weighing, and assessment.
- **Merchant workflow:** view available lots, place validated bids, and follow price history.
- **Palledar workflow:** manage dispatch-related labour tasks.
- **Manager workflow:** inspect end-to-end lot traceability across participants.
- **Shared lifecycle:** Arrived → Weighed & Assessed → Auctioned & Settled → Dispatched.
- **Market context:** price analytics and MSP benchmark comparisons.

## Tech stack

- Next.js + TypeScript
- React
- Supabase
- Tailwind CSS
- Recharts

## Run locally

### Prerequisites

- Node.js 20+
- A Supabase project

### Setup

```bash
git clone https://github.com/Kartik-idk/Kisan-Mandi-mvp.git
cd Kisan-Mandi-mvp
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

```bash
npm run dev     # start the development server
npm run lint    # run ESLint
npm run build   # create a production build
npm run start   # run the production build
```

## Project notes

See [walkthrough.md](walkthrough.md) for an implementation walkthrough covering lot traceability, bidding rules, shared timeline behaviour, and price-market context.

## Status

This is an MVP intended to demonstrate a coherent, role-aware mandi operating flow.
