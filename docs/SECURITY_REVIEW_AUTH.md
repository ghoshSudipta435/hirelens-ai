# Authentication Security Review

Scope:
- [backend/src/modules/auth/auth.service.ts](/Users/sg/Dev/PROJECTS/HireLens%20AI/backend/src/modules/auth/auth.service.ts)
- [backend/src/modules/auth/auth.controller.ts](/Users/sg/Dev/PROJECTS/HireLens%20AI/backend/src/modules/auth/auth.controller.ts)
- [backend/src/modules/auth/auth.middleware.ts](/Users/sg/Dev/PROJECTS/HireLens%20AI/backend/src/modules/auth/auth.middleware.ts)
- [backend/src/modules/auth/token.service.ts](/Users/sg/Dev/PROJECTS/HireLens%20AI/backend/src/modules/auth/token.service.ts)
- [backend/src/app.ts](/Users/sg/Dev/PROJECTS/HireLens%20AI/backend/src/app.ts)
- [backend/prisma/schema.prisma](/Users/sg/Dev/PROJECTS/HireLens%20AI/backend/prisma/schema.prisma)

## Executive Summary

The auth module had several high-risk gaps: refresh tokens were exposed in JSON responses, refresh rotation was not atomic, auth endpoints had no rate limiting, and there was no durable audit trail. JWT verification was also missing issuer/audience/algorithm constraints. These issues have been fixed.

## Findings and Remediation

### High

1. Refresh token exposure in JSON responses
   - Risk: refresh tokens were returned in response bodies, increasing exposure to XSS and client-side leakage.
   - Fix: refresh tokens are now delivered in an `httpOnly` cookie and are no longer echoed in auth JSON responses.

2. Refresh token replay/race condition
   - Risk: the refresh flow revoked tokens non-atomically, allowing concurrent reuse of the same refresh token.
   - Fix: refresh rotation now uses an atomic `updateMany` guard on token id, hash, user id, and `revokedAt = null`.

3. Missing brute-force protection
   - Risk: register/login/refresh/logout endpoints could be hammered without a throttle.
   - Fix: route-scoped rate limiting was added to all auth mutation endpoints.

4. Missing audit logging
   - Risk: auth events were not durably recorded for incident response or abuse investigations.
   - Fix: auth events are now written to `AuthAuditEvent` and also emitted through structured logs.

### Medium

5. Cookie security hardening
   - Risk: refresh token handling did not use secure browser cookie controls.
   - Fix: refresh cookies are `httpOnly`, scoped to `/api/v1/auth`, and set with `SameSite=Lax` in non-production and `SameSite=None` with `Secure` in production.

6. JWT validation hardening
   - Risk: token verification did not constrain issuer, audience, or algorithm.
   - Fix: access and refresh JWTs now use `HS256`, issuer/audience constraints, and separate access/refresh secrets.

7. Proxy-aware IP handling
   - Risk: auth rate limiting and IP logging could be distorted behind a reverse proxy.
   - Fix: Express now trusts the first proxy hop, which aligns IP handling with Render/Vercel-style deployments.

8. Excessive request body size
   - Risk: unbounded JSON bodies can be used for trivial resource abuse.
   - Fix: JSON and URL-encoded request bodies are capped at `100kb`.

## OWASP Top 10 Coverage

- A01 Broken Access Control: protected routes use access-token middleware and role checks; refresh/logout use token ownership checks.
- A02 Cryptographic Failures: JWT validation is constrained, secrets are separated, and refresh tokens are hashed at rest.
- A03 Injection: auth inputs are schema-validated with Zod; no raw SQL is used in the auth flow.
- A07 Identification and Authentication Failures: rate limiting, secure cookies, and atomic refresh rotation reduce brute-force and replay risk.
- A09 Security Logging and Monitoring Failures: durable audit events and structured logs were added.

## Verification

Validated after the fixes:
- `npm run db:generate`
- `npm run test --workspace backend`
- `npm run lint --workspace backend`
- `npm run typecheck --workspace backend`

## Residual Risks

- The auth module now relies on cookie-based refresh flows; frontend clients must send credentials and should not attempt to persist refresh tokens in local storage.
- Memory-backed rate limiting is sufficient for the current single-instance scaffold, but a shared store will be needed if the backend becomes horizontally scaled.
- Audit events are persisted, but centralized log shipping/alerting is still needed for operational monitoring.
