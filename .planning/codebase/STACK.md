# Codebase Technology Stack

**Analysis Date:** 2026-09-10

## Core Technologies & Runtime
- **Runtime:** Node.js (v20+)
- **Primary Language:** TypeScript (v5) / JavaScript
- **Framework:** Next.js (v16.3.4, App Router with Turbopack)
- **UI Library:** React (v19.2.8), React DOM (v19.2.8)

## Styling & Design System
- **CSS Framework:** Tailwind CSS (v4) with `@tailwindcss/postcss`
- **Iconography:** Lucide React (`lucide-react` v1.39.0)
- **Charts & Data Visualization:** Recharts (`recharts` v3.10.1)

## Backend & Database
- **BaaS / Database:** Supabase (`@supabase/supabase-js` v2.113.0)
- **API Pattern:** Next.js App Router Route Handlers (`src/app/api/`)

## Testing & Tooling
- **E2E Testing:** Playwright (`playwright` v1.62.1)
- **Linter:** ESLint (v9) with `eslint-config-next`

## Configuration
- `next.config.ts`: Next.js configuration
- `tsconfig.json`: TypeScript paths (`@/*` mapping to `./src/*`) and strict mode setup
- `postcss.config.mjs`: PostCSS plugin configuration
- `.env.local`: Supabase public URL and anon key configuration

<!-- refreshed: 2026-09-10 -->
*Codebase tech stack analysis: 2026-09-10*
