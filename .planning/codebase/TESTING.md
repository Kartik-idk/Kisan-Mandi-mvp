# Testing Practices & QA

**Analysis Date:** 2026-09-10

## Testing Framework & Tools
- **E2E Testing:** Playwright configured in `package.json`.
- **Static Analysis & Type Checking:** TypeScript compilation (`npx tsc --noEmit`) and ESLint (`npm run lint`).
- **Ad-hoc Scripts:** Node.js verification and seed scripts in root directory (`test-*.js`, `sweep*.js`).

## Test Scope & Validation
- **End-to-End Workflow Verification:** Validating complete journey from Lot Arrival -> Weighment -> Auction Bidding -> Transaction Generation -> Palledar Task Dispatch.
- **Role Isolation Validation:** Multi-tab session verification ensuring simultaneous logins under different roles do not overwrite authentication keys.

## Recommended Commands
- **Type Check:** `npx tsc --noEmit`
- **Linter:** `npm run lint`
- **Build Verification:** `npm run build`

<!-- refreshed: 2026-09-10 -->
*Codebase testing analysis: 2026-09-10*

## Future Test Strategy
- Unit tests for price calculation algorithms.
- Playwright automated regression suite across all 5 user personas.
