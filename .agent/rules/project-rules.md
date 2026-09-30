# IEDC BMCE v3 Development Rules

All future work on this repository must adhere strictly to these rules:

1. **TypeScript strict mode, no `any`**
   - TypeScript `strict` mode must remain enabled at all times.
   - Do not use `any` in any file. Use explicit types, interfaces, discriminated unions, or `unknown` with type narrowing.

2. **All schema changes go in `supabase/migrations` as timestamped SQL files**
   - Never edit the database schema by hand or directly in the Supabase Studio dashboard.
   - All DDL operations, table creations, alter statements, and functions must be tracked in version-controlled, timestamped migration files (e.g., `supabase/migrations/<YYYYMMDDHHMMSS>_<description>.sql`).

3. **Privileged actions must run in Supabase Edge Functions or SECURITY DEFINER RPCs, never from client code**
   - Sensitive actions—including KYC verification decisions, role assignments/promotions, hackathon grading/scoring, and administrative report exports—must never be performed via direct client-side `update()` or `delete()` calls on database tables.
   - Privileged operations must be encapsulated in Supabase Edge Functions or PostgreSQL `SECURITY DEFINER` stored procedures that verify user identity, role, and permissions on the server.

4. **Every table has RLS enabled, with policies written and tested**
   - Row Level Security (RLS) must be explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on every table without exception.
   - Policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations must be defined and validated for each role (`anon`, `authenticated`, admin roles).

5. **Validate inputs with Zod. Generate DB types with `supabase gen types typescript`**
   - All client inputs, form submissions, and Edge Function payloads must be validated at runtime using Zod schemas.
   - TypeScript definitions for the database schema must be generated using `supabase gen types typescript` to ensure end-to-end type safety between the database and the application.

6. **Never log or return Aadhaar/PAN numbers or document URLs to the client**
   - Sensitive Personally Identifiable Information (PII) such as Aadhaar numbers, PAN numbers, and raw uploaded document URLs must never be returned in client-side queries, stored in unmasked client-accessible state, or logged to console or export files.
   - Mask numbers where needed (e.g., `XXXX-XXXX-1234`) and use short-lived, signed URLs only when explicitly authorized.

7. **After every task: run typecheck, lint, and tests, and summarize what changed and what could break**
   - Always verify build and type safety (`npm run build` / `tsc --noEmit`).
   - Deliver a clear summary detailing what changed, verified outputs, and any potential side effects or breaking points.
