# Directory Layout & File Organization

**Analysis Date:** 2026-09-10

## Directory Structure

```text
mandi-mvp/
├── .planning/                  # Project management & codebase map
│   └── codebase/               # Codebase documentation
├── public/                     # Static media and assets
├── src/
│   ├── app/
│   │   ├── agent/page.tsx      # Commission Agent dashboard
│   │   ├── api/
│   │   │   ├── log/route.ts    # Debug/audit logging API
│   │   │   └── seed/route.ts   # Database seed utility API
│   │   ├── farmer/page.tsx     # Farmer mobile dashboard
│   │   ├── manager/page.tsx    # Mandi Manager analytics dashboard
│   │   ├── merchant/page.tsx   # Merchant purchasing dashboard
│   │   ├── palledar/page.tsx   # Palledar labor dashboard
│   │   ├── globals.css         # Global Tailwind CSS styles
│   │   ├── layout.tsx          # Root layout wrapper
│   │   └── page.tsx            # Login and landing page
│   ├── components/
│   │   ├── PriceHistory.tsx    # Shared market price analytics component
│   │   └── Toast.tsx           # Toast notification component
│   └── lib/
│       └── supabase.ts         # Supabase client singleton
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Key File Locations
- **Entry Point / Auth:** `src/app/page.tsx`
- **Database Client:** `src/lib/supabase.ts`
- **Dashboards:** `src/app/{farmer,agent,merchant,palledar,manager}/page.tsx`
- **Shared Components:** `src/components/`

<!-- refreshed: 2026-09-10 -->
*Codebase structure analysis: 2026-09-10*
