# Code Conventions & Style Guidelines

**Analysis Date:** 2026-09-10

## Code Style & Formatting
- **TypeScript:** Strict typing where applicable, using interfaces for DB entities (`Lot`, `Transaction`, `Dispute`, `WorkTask`).
- **React Patterns:** Functional components with React hooks (`useState`, `useEffect`, `useCallback`).
- **Styling:** Utility-first CSS using Tailwind CSS v4 class names.

## Naming Conventions
- **Files & Routes:** kebab-case / lowercase directories matching Next.js App Router conventions.
- **Components:** PascalCase (e.g., `PriceHistory`, `Toast`, `LotCard`).
- **Local Storage Keys:** Role-prefixed format `mandi_user_<role>` (e.g., `mandi_user_farmer`, `mandi_user_merchant`).

## Internationalization & Localization
- **Dictionaries:** Localized dictionary objects (`t = { EN: {...}, HI: {...}, KN: {...} }`) embedded directly within components for rural accessibility.

## Error & State Handling
- Explicit loading spinners via Lucide React (`Loader2`, `RefreshCw`).
- Inline error banners and toast alerts for transactional actions.

<!-- refreshed: 2026-09-10 -->
*Codebase conventions analysis: 2026-09-10*
