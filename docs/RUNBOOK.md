# IEDC BMCE Operations Runbook

This runbook contains operational procedures, environment configurations, secret rotation playbooks, deployment guides, and data privacy protocols for the IEDC BMCE production platform.

---

## 1. Environment Variables Reference

### 1.1 Client-Side (Vite Bundle)

| Variable | Description | Example / Default | Required in Production |
| :--- | :--- | :--- | :---: |
| `VITE_SUPABASE_URL` | Supabase project API gateway | `https://quxwzqcbuksxxgpprztw.supabase.co` | **Yes** |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon client key | `eyJhbGciOi...` | **Yes** |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key | `0x4AAAAAA...` (Test: `1x00000000000000000000AA`) | **Yes** |
| `VITE_SENTRY_DSN` | Sentry browser DSN for error telemetry | `https://abc@o123.ingest.sentry.io/456` | **Yes** |
| `VITE_APP_ENV` | Application environment indicator | `production` / `staging` / `development` | Recommended |

### 1.2 Supabase Edge Functions Secrets

| Variable | Description | Example / Default | Required in Production |
| :--- | :--- | :--- | :---: |
| `SUPABASE_URL` | Internal Edge Runtime URL | Automatically injected by Supabase | Auto |
| `SUPABASE_ANON_KEY` | Public anon key for caller verification | Automatically injected by Supabase | Auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged service key for atomic RPCs | Set in Supabase Dashboard Secrets | **Yes** |
| `RESEND_API_KEY` | Resend API key for transactional emails | `re_123456789...` | Optional (falls back to simulation) |
| `SENTRY_DSN` | Sentry DSN for Deno Edge Functions | `https://abc@o123.ingest.sentry.io/456` | Recommended |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | `0x4AAAAAA...` | Optional |

### 1.3 CI/CD Secrets (GitHub Repository Secrets)

| Secret | Description | Where to Set |
| :--- | :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_IEDCWEBSITE` | Google Cloud Service Account JSON for Firebase Hosting | GitHub Repository Secrets |
| `VITE_SUPABASE_URL` | Production Supabase URL | GitHub Repository Secrets |
| `VITE_SUPABASE_ANON_KEY` | Production Supabase Anon Key | GitHub Repository Secrets |
| `VITE_TURNSTILE_SITE_KEY` | Production Cloudflare Turnstile Site Key | GitHub Repository Secrets |
| `VITE_SENTRY_DSN` | Production Sentry Frontend DSN | GitHub Repository Secrets |

---

## 2. Deployment Procedures

### 2.1 Preview Deployment (Automated Per PR)
1. Whenever a Pull Request is opened or updated against `main`, the GitHub Actions workflow `.github/workflows/ci.yml` triggers automatically.
2. The workflow performs:
   - Dependency verification, ESLint, and TypeScript typechecking.
   - Vitest unit test suite and RLS matrix test suite (`npm run test:rls`).
   - Supabase CLI migration verification (`supabase db lint` and `supabase db reset`).
   - Playwright end-to-end headless browser test suite.
   - Builds production assets and deploys a preview channel to Firebase Hosting (`pr-<PR_NUMBER>`).
3. The preview URL is posted directly as a comment on the Pull Request.

### 2.2 Production Deployment

#### Step 1: Apply Database Migrations
Always apply database schema migrations before deploying new frontend bundles:
```bash
# Push migrations to staging / production
supabase db push
```

#### Step 2: Deploy Edge Functions
Deploy updated Edge Functions to Supabase:
```bash
supabase functions deploy convert-pdf-to-webp --no-verify-jwt
supabase functions deploy send-notification --no-verify-jwt
supabase functions deploy kyc-submit --no-verify-jwt
supabase functions deploy kyc-decide --no-verify-jwt
```

#### Step 3: Build & Deploy Frontend
Merge the pull request into `main`, or run manually:
```bash
npm run typecheck
npm run test
npm run test:rls
npm run build
firebase deploy --only hosting
```

---

## 3. Secret & Key Rotation Playbooks

### 3.1 Supabase Anon & Service Role Key Rotation
> [!IMPORTANT]
> Rotating the Supabase keys invalidates existing user sessions and tokens. Schedule during an announced maintenance window.

1. Navigate to **Supabase Dashboard** -> **Project Settings** -> **API**.
2. Under **Project API keys**, select **Generate new JWT secret** (or regenerate Anon/Service keys).
3. Copy the newly generated **anon** and **service_role** keys.
4. Update GitHub Secrets:
   - `VITE_SUPABASE_ANON_KEY`
5. Update Supabase Edge Functions secrets:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="new-service-key"
   ```
6. Trigger a new production build and redeploy.

### 3.2 Cloudflare Turnstile Key Rotation
1. Log in to the **Cloudflare Dashboard** -> **Turnstile**.
2. Select the `IEDC BMCE` widget and click **Rotate Secret Key** (or create a new site widget).
3. Copy the new **Site Key** and **Secret Key**.
4. Update `.env.production` and GitHub Repository Secret `VITE_TURNSTILE_SITE_KEY`.
5. Trigger frontend redeployment. Old keys will remain valid during Cloudflare's grace period.

### 3.3 Resend Email API Key Rotation
1. Go to **Resend Dashboard** -> **API Keys**.
2. Generate a new API key named `iedc-prod-YYYY-MM`.
3. Update Supabase Edge Functions secrets:
   ```bash
   supabase secrets set RESEND_API_KEY="re_new_key"
   ```
4. Send a test notification to verify delivery.
5. Delete the obsolete key in the Resend dashboard.

---

## 4. Handling KYC Data Requests (DSAR / Privacy Protocol)

Under the Digital Personal Data Protection (DPDP) Act and college privacy guidelines, students have the right to access, rectify, and delete their submitted KYC identification records.

### 4.1 Data Subject Access Request (DSAR) - Student Data Export
To export all KYC data and identification files for a specific user:

1. Identify the user ID:
   ```sql
   SELECT id, email, full_name FROM profiles WHERE email = 'student@bmce.ac.in';
   ```
2. Retrieve the KYC record and audit trail:
   ```sql
   SELECT * FROM kyc_verifications WHERE user_id = '<USER_ID>';
   SELECT * FROM audit_log WHERE entity_type = 'kyc' AND user_id = '<USER_ID>' ORDER BY created_at DESC;
   ```
3. Locate the encrypted identity document in Supabase Storage (`kyc-docs` bucket):
   Path format: `<USER_ID>/<TIMESTAMP>_<FILENAME>`
4. Package the JSON metadata and document file, and securely deliver it to the requesting student.

### 4.2 Right to be Forgotten / KYC Data Deletion Request
When a student withdraws or requests complete purging of their KYC documents:

1. **Delete Storage Files from `kyc-docs`**:
   Execute via Supabase Dashboard or script:
   ```ts
   const { data, error } = await supabase.storage
     .from('kyc-docs')
     .remove([`${userId}/${fileName}`]);
   ```
2. **Scrub the KYC Database Record**:
   ```sql
   UPDATE kyc_verifications
   SET 
     doc_file_path = NULL,
     doc_number_last4 = 'XXXX',
     full_name = '[DELETED_USER]',
     status = 'rejected',
     rejection_reason = 'Data deletion requested by subject under privacy rights',
     retention_delete_at = NOW()
   WHERE user_id = '<USER_ID>';
   ```
3. **Log the Privacy Compliance Action in Audit Trail**:
   ```sql
   INSERT INTO audit_log (admin_id, action, entity_type, entity_id, metadata)
   VALUES (
     '<ADMIN_USER_ID>',
     'KYC_PURGE_REQUEST_EXECUTED',
     'kyc_verifications',
     '<USER_ID>',
     '{"reason": "Student DSAR Right to Erasure Request", "purged_at": "' || NOW() || '"}'::jsonb
   );
   ```

### 4.3 Automated Data Retention Lifecycle
- Rejected KYC applications and obsolete documents are automatically purged after 90 days via the scheduled database retention cron job:
  ```sql
  SELECT cron.schedule(
    'purge_expired_kyc_docs_daily',
    '0 3 * * *', -- Daily at 03:00 UTC
    $$DELETE FROM kyc_verifications WHERE retention_delete_at <= NOW()$$
  );
  ```

---

## 5. Incident Response & Troubleshooting

### 5.1 Sentry Crash Spike
1. Open the [Sentry Issues Dashboard](https://sentry.io).
2. Filter by environment (`production`) and tag (`handled:false`).
3. Inspect the stack trace: production source maps are automatically uploaded on build, pinpointing exact TypeScript files and line numbers.
4. If a specific Edge Function is throwing:
   - Check Supabase Dashboard -> **Edge Functions** -> **Logs**.
   - Note error status codes and inspect the incoming payload.

### 5.2 Rate Limiting 429 Remediation
If legitimate users or evaluators encounter `429 Too Many Requests`:
- Edge Function rate limits can be adjusted in `supabase/functions/<function-name>/index.ts` (e.g. increase `limit` or `windowSeconds`).
- Check if multiple users are sharing a single campus NAT IP. The rate limiter inspects `x-forwarded-for`, `x-real-ip`, and fallback authorization tokens.

### 5.3 Administrative MFA Lockout Recovery
If an Admin or Execom user loses their authenticator device:
1. **Option A (Backup Code)**: The user enters one of their 4 single-use backup recovery codes generated during enrollment.
2. **Option B (Admin Override)**: Another verified super-admin can reset their MFA state:
   - Clear the user's stored TOTP enrollment secret in their profile metadata.
   - On their next login, the user will be prompted to enroll a new authenticator device.
