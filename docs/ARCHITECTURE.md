# IEDC BMCE System Architecture Documentation

## 1. System Overview

The **Innovation and Entrepreneurship Development Centre (IEDC) at Baselios Mathews II College of Engineering (BMCE)** web platform is a modern, enterprise-grade collaboration and startup incubation hub. It provides students, innovators, faculty mentors, evaluators, and executive committee members with end-to-end tools to submit startup ideas, form hackathon teams, complete institutional KYC verification, participate in rubric evaluations, and read digital publications.

### High-Level Architecture Diagram

```mermaid
graph TD
    Client[Browser / Progressive Web App]
    SW[Service Worker sw.js / IndexedDB Queue]
    Turnstile[Cloudflare Turnstile CAPTCHA]
    Sentry[Sentry Telemetry / Source Maps]
    
    subgraph Supabase BaaS
        API[PostgreSQL REST / Realtime WebSockets]
        RLS[Row Level Security Engine]
        Storage[Encrypted Storage Buckets]
        
        subgraph Deno Edge Functions
            WebPFunc[convert-pdf-to-webp]
            NotifFunc[send-notification]
            KycSubFunc[kyc-submit]
            KycDecFunc[kyc-decide]
            RateLimiter[Sliding Window Rate Limiter]
        end
    end

    Client --> SW
    Client --> Turnstile
    Client --> Sentry
    Client --> API
    API --> RLS
    Client --> Deno Edge Functions
    Deno Edge Functions --> RateLimiter
    Deno Edge Functions --> Storage
    Deno Edge Functions --> API
```

---

## 2. Frontend Architecture

### 2.1 Core Framework & Tooling
- **Framework**: React 18 with TypeScript 5.7+ running on Vite 6.
- **State & Data Fetching**: TanStack React Query (`@tanstack/react-query`) with normalized client caches, reactive query invalidations, and optimistic updates.
- **Routing**: React Router v6 SPA with route-level security guards (`ProtectedRoute`, `AdminMfaModal`).
- **Telemetry**: `@sentry/react` with production source maps, browser tracing, session replay, and PII redaction.

### 2.2 Progressive Web App (PWA) & Offline-First Design
- **Service Worker (`public/sw.js`)**:
  - Implements a Cache-First strategy for static assets (scripts, styles, brand icons, flipbook WebP pages).
  - Stale-While-Revalidate strategy for API reads.
  - Transparent Offline Indicator banner across the application header when network connectivity is lost.
- **Offline Writes Policy**:
  - Writes **never** falsely simulate network success while offline.
  - Chat messages and idea drafts are queued safely in client storage with a pending synchronization indicator.
  - Automatically flushed when `navigator.onLine` fires.

### 2.3 Interactive Features
- **Full-Text & Fuzzy Search**:
  - Backed by Postgres `tsvector` generated columns with GIN indexes and `pg_trgm` similarity matching.
  - Real-time search box in the Navbar debounced to 250ms with instant category grouping (Ideas, Discussions, Events).
- **Newsletter Flipbook**:
  - PDF uploads trigger the `convert-pdf-to-webp` Edge Function, rasterizing pages to WebP.
  - Flipbook lazy loads WebP page images sequentially, ensuring sub-second load times even for heavy 50+ page editions.

---

## 3. Security Architecture & RLS Matrix

### 3.1 Defense-in-Depth Security Model
The system enforces security at multiple distinct layers:
1. **Network & HTTP Layer**: Strict HTTP response headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).
2. **Bot & Anti-Abuse Layer**: Cloudflare Turnstile verification required on signup, discussion creation, and idea submission forms.
3. **Application & Role Layer**: Client route guards and mandatory MFA for administrative personnel.
4. **Edge Runtime Layer**: Sliding-window rate limiters per IP / authorization token and Sentry exception capture on all edge functions.
5. **Database Layer**: PostgreSQL Row-Level Security (RLS) policies on every public table, anti-tampering triggers, and CHECK constraints.

### 3.2 Role-Based Access Control (RBAC) Matrix

| Resource / Table | Anon | Student | Innovator | Reviewer | Admin / Execom |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `profiles` | Denied | Read/Update Self | Read/Update Self | Read/Update Self | Read All / Update Role |
| `kyc_verifications` | **DENIED** | Read/Insert Self (pending only) | Read Self | **DENIED** | Full Access & Review |
| `ideabox_submissions` | Read Approved | Read Approved + Self / Insert | Full Create / Update Self | Read Assigned | Full Access & Status Override |
| `team_chat_messages` | **DENIED** | Team Members Only | Team Members Only | **DENIED** | Read All (Audit) |
| `forum_discussions` | Read Public | Read & Create | Read & Create | Read & Create | Full Access & Moderation |
| `audit_log` | **DENIED** | **DENIED** | **DENIED** | **DENIED** | Read Only (Append-Only Trigger) |
| `newsletter_editions` | Read Published | Read Published | Read Published | Read Published | Full CRUD |
| `review_criteria` | Read Active | Read Active | Read Active | Read Active | Full CRUD |
| `idea_reviews` | **DENIED** | Read Self Idea Review | Read Self Idea Review | Read/Write Assigned | Full Access |

### 3.3 Database Hardening Invariants
1. **Anti-Escalation Trigger**: A Postgres `BEFORE UPDATE` trigger on `profiles` rejects any non-admin attempt to elevate `role` to `'Admin'` or `'Execom'`.
2. **KYC Self-Verification Barrier**: A Postgres CHECK constraint restricts initial `kyc_verifications.status` to `'pending'`. Only the trusted RPC `exec_kyc_decision` can transition status to `'verified'` or `'rejected'`.
3. **Audit Immutability**: The `audit_log` table cannot be deleted or modified by non-service-role clients; all administrative events are appended automatically.

---

## 4. Multi-Factor Authentication (MFA)

- **Target Personas**: Mandatory for `Admin` and `Execom` roles.
- **Protocol**: Time-based One-Time Password (TOTP) compliant with RFC 6238, compatible with Google Authenticator, 1Password, and Microsoft Authenticator.
- **Recovery Strategy**: 4 single-use backup recovery codes generated on enrollment.
- **Session Elevation**:
  - Standard email/password login issues an initial JWT.
  - Attempting to load the Admin Control Center triggers `mfaService.assertMfaVerified(role, action)`.
  - The UI presents `AdminMfaModal` requiring 6-digit TOTP validation before admin operations are unlocked.

---

## 5. Edge Functions Architecture

Edge Functions execute on the Supabase Edge Runtime (Deno).

| Function Name | Route | Purpose | Rate Limit |
| :--- | :--- | :--- | :--- |
| `convert-pdf-to-webp` | `/convert-pdf-to-webp` | Converts uploaded newsletter PDF pages to WebP | 5 req / min |
| `send-notification` | `/send-notification` | Dispatches in-app and Resend transactional emails | 30 req / min |
| `kyc-submit` | `/kyc-submit` | Secure document upload & Aadhaar/PAN last-4 extraction | 10 req / min |
| `kyc-decide` | `/kyc-decide` | Atomic approval/rejection RPC invocation | 60 req / min |

All functions share:
- `_shared/rateLimiter.ts`: Sliding-window token rate limiting returning standard `429 Too Many Requests` with `Retry-After` headers.
- `_shared/sentry.ts`: Automated exception logging to Sentry with contextual request metadata.
