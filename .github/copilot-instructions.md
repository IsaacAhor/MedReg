# GitHub Copilot Instructions

GitHub Copilot will automatically read AGENTS.md from the workspace root.

## Additional Context
When generating code for this project:

1. **Always check AGENTS.md first** for:
   - Ghana domain rules (Ghana Card validation, NHIS format)
   - NHIE middleware architecture (NO direct backend connections)
   - OpenMRS code patterns (Service/DAO/REST controller)
   - Frontend patterns (Next.js + shadcn/ui + TanStack Query)
   - Security rules (PII masking, no secrets in logs)

2. **Common Tasks:**
   - Patient registration: Reference AGENTS.md "OpenMRS Code Patterns" section
   - Ghana Card validation: Use Luhn checksum algorithm from AGENTS.md
   - NHIE integration: Follow retry logic and error handling from AGENTS.md
   - Frontend forms: Use shadcn/ui + React Hook Form + Zod pattern from AGENTS.md

3. **Testing:**
   - Backend: JUnit + Mockito, follow test patterns in AGENTS.md
   - Frontend: Vitest + React Testing Library, >70% coverage
   - E2E: Playwright for critical flows (patient registration, OPD workflow)

4. **Before Suggesting Code:**
   - Check if pattern exists in AGENTS.md (don't reinvent)
   - Ensure NHIE middleware architecture followed (no direct NHIA calls)
   - Verify Ghana domain rules applied (Ghana Card format, NHIS validation)
   - Confirm security rules followed (PII masked in logs)

## Quick Reference
- Project: Ghana EMR MVP, 16-20 week timeline
- Backend: OpenMRS 2.6.0, Java 8, Spring, MySQL 8.0
- Frontend: Next.js 14, TypeScript 5, shadcn/ui, TanStack Query
- Integration: NHIE middleware (OAuth 2.0, FHIR R4)
- Target: Win MoH pilot facility + EOI Q1 2026
