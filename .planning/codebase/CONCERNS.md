# Codebase Concerns & Technical Debt

**Analysis Date:** 2026-09-10

## Known Gaps & Technical Debt
1. **Mock Authentication:** Phone numbers authenticate via arbitrary 4-digit mock OTPs without real SMS provider integration (Twilio/Fast2SMS) or backend signature validation.
2. **Missing MSP Context:** Market price analytics calculate simple statistical averages without comparing against Government Minimum Support Price (MSP) benchmarks.
3. **Subjective Quality Assaying:** Quality grades (A, B, C) are manually assigned by the Agent without structured assaying certificates, moisture analysis, or parameter verification.
4. **Client-Side Polling:** Dashboards use frequent `setInterval` polling (3-10 seconds) rather than Supabase real-time websocket subscriptions.
5. **Root Directory Clutter:** Numerous scratch and test scripts (`test-*.js`, `fix-*.js`) exist in the project root and should eventually be moved or archived.
6. **No Escrow / Payment Gateway:** Settlement transactions are digitally marked as PAID/PENDING without UPI/Razorpay webhook verification or escrow locking.

## Security & Reliability Considerations
- Supabase Row Level Security (RLS) policies should be audited to ensure that clients only modify authorized rows.
- Transaction generation relies on client-side math rather than atomic server-side database transactions or stored procedures.
- Role authorization checks currently occur client-side in `useEffect` lifecycle hooks.

<!-- refreshed: 2026-09-10 -->
*Codebase concerns analysis: 2026-09-10*

## Mitigation Priority
- Priority 0: Integrate MSP benchmarks into price displays.
- Priority 1: Strengthen dispute resolution audit trails.
