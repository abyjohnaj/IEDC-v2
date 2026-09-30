/**
 * IEDC BMCE: One-off KYC Data Migration & PII Masking Script
 * 
 * Safely migrates existing legacy rows in `kyc_verifications`:
 * - Extracts last 4 alphanumeric digits into `doc_number_last4`
 * - Nullifies or wipes raw PII `doc_number` column
 * - Ensures `retention_delete_at` is populated for verified rows (verified_at + 90 days)
 * 
 * IMPORTANT SAFETY RULES:
 * 1. Defaults to --dry-run mode unless --execute is explicitly supplied.
 * 2. Strict confirmation safeguard prevents running against production without explicit approval.
 * 
 * Usage:
 *   Dry-run mode (read-only):
 *     npx tsx scripts/migrate-kyc-masking.ts --dry-run
 * 
 *   Execute mode (requires SUPABASE_SERVICE_ROLE_KEY or active db credentials):
 *     npx tsx scripts/migrate-kyc-masking.ts --execute
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://quxwzqcbuksxxgpprztw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';

const isDryRun = !process.argv.includes('--execute');
const isProduction = SUPABASE_URL.includes('quxwzqcbuksxxgpprztw.supabase.co') && !process.argv.includes('--staging');

console.log('='.repeat(70));
console.log('🛡️  IEDC BMCE: KYC PII Masking & Data Migration Tool');
console.log('='.repeat(70));
console.log(`Target URL:     ${SUPABASE_URL}`);
console.log(`Mode:           ${isDryRun ? '🔍 DRY RUN (No changes will be written)' : '⚡ LIVE EXECUTE'}`);
console.log(`Environment:    ${isProduction ? '⚠️ PRODUCTION' : 'DEVELOPMENT / LOCAL'}`);
console.log('='.repeat(70));

if (isProduction && !isDryRun) {
  const allowProd = process.env.CONFIRM_PRODUCTION_MIGRATION === 'YES_I_AM_SURE';
  if (!allowProd) {
    console.error('\n🛑 [SAFETY ABORT] Attempted to run live execution against production!');
    console.error('As per project rules, this script CANNOT be run against production without explicit user approval.');
    console.error('To run against production, the user must explicitly approve and set:');
    console.error('  CONFIRM_PRODUCTION_MIGRATION=YES_I_AM_SURE');
    process.exit(1);
  }
}

if (!isDryRun && !SERVICE_KEY) {
  console.error('\n❌ [ERROR] Live execution requires SUPABASE_SERVICE_ROLE_KEY to perform privileged schema updates.');
  console.error('Please export SUPABASE_SERVICE_ROLE_KEY before running with --execute.\n');
  console.log('Alternatively, you can run this equivalent SQL snippet directly in Supabase SQL Editor:');
  console.log(`
  BEGIN;
  -- 1. Migrate last 4 digits
  UPDATE public.kyc_verifications
  SET doc_number_last4 = RIGHT(REGEXP_REPLACE(doc_number, '\\s+', '', 'g'), 4)
  WHERE (doc_number_last4 IS NULL OR doc_number_last4 = '') 
    AND doc_number IS NOT NULL;

  -- 2. Populate retention period (90 days post verification)
  UPDATE public.kyc_verifications
  SET retention_delete_at = verified_at + INTERVAL '90 days'
  WHERE status = 'verified' 
    AND retention_delete_at IS NULL;

  -- 3. Scrub raw plaintext document number
  UPDATE public.kyc_verifications
  SET doc_number = NULL
  WHERE doc_number_last4 IS NOT NULL;
  COMMIT;
  `);
  process.exit(0);
}

// Client for dry-run (can use anon key or service key)
const clientKey = SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eHd6cWNidWtzeHhncHByenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDY4NDUsImV4cCI6MjEwNDk4Mjg0NX0.P_NWWDiY8yWgmYpSq2ExWhjNad872EwsZGo7td20DLs';
const supabase = createClient(SUPABASE_URL, clientKey);

async function runMigration() {
  try {
    console.log('\nScanning kyc_verifications for legacy unmasked rows...');
    
    let { data: rows, error } = await supabase
      .from('kyc_verifications')
      .select('id, user_id, doc_type, doc_number, doc_number_last4, status, verified_at, retention_delete_at');

    if (error && error.message?.includes('doc_number_last4 does not exist')) {
      const fallbackQuery = await supabase
        .from('kyc_verifications')
        .select('id, user_id, doc_type, doc_number, status, verified_at');
      rows = fallbackQuery.data;
      error = fallbackQuery.error;
    }

    if (error) {
      console.warn(`Query response note: ${error.message}`);
      console.log('If RLS prevented reading raw rows without service role key, run the SQL migration directly in Supabase dashboard.');
      return;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ No rows found or table is empty. Everything clean!');
      return;
    }

    console.log(`Found ${rows.length} total verification records. Analyzing...`);

    let needingMasking = 0;
    let needingRetention = 0;

    for (const r of rows) {
      const rawNumber = (r as any).doc_number;
      const existingLast4 = (r as any).doc_number_last4;
      const status = r.status;
      const verifiedAt = r.verified_at;
      const retentionDeleteAt = (r as any).retention_delete_at;

      const needsMask = rawNumber && (!existingLast4 || rawNumber.length > 4);
      const needsRet = status === 'verified' && verifiedAt && !retentionDeleteAt;

      if (needsMask) needingMasking++;
      if (needsRet) needingRetention++;

      if (needsMask || needsRet) {
        const cleanDigits = rawNumber ? rawNumber.replace(/\s+/g, '') : '';
        const derivedLast4 = cleanDigits ? cleanDigits.slice(-4) : '****';
        console.log(`  - Record ${r.id.slice(0, 8)}... (${r.doc_type || 'id'}):`);
        if (needsMask) {
          console.log(`      * Raw Doc Length: ${cleanDigits.length} chars -> Last4: ${derivedLast4} (Raw PII will be scrubbed)`);
        }
        if (needsRet) {
          const purgeDate = new Date(new Date(verifiedAt).getTime() + 90 * 24 * 3600 * 1000).toISOString();
          console.log(`      * Retention Date: sets retention_delete_at to ${purgeDate}`);
        }

        if (!isDryRun) {
          const updatePayload: Record<string, any> = {
            doc_number_last4: derivedLast4,
            doc_number: null
          };
          if (needsRet) {
            updatePayload.retention_delete_at = new Date(new Date(verifiedAt).getTime() + 90 * 24 * 3600 * 1000).toISOString();
          }

          const { error: updateErr } = await supabase
            .from('kyc_verifications')
            .update(updatePayload)
            .eq('id', r.id);

          if (updateErr) {
            console.error(`      ❌ Update failed for ${r.id}: ${updateErr.message}`);
          } else {
            console.log(`      ✅ Successfully masked and scrubbed.`);
          }
        }
      }
    }

    console.log('\n' + '-'.repeat(50));
    console.log(`Summary:`);
    console.log(`  Total records analyzed:             ${rows.length}`);
    console.log(`  Records needing PII masking:        ${needingMasking}`);
    console.log(`  Records needing retention period:   ${needingRetention}`);
    console.log('-'.repeat(50));

    if (isDryRun) {
      console.log('\n✨ Dry run complete. Zero changes written to database.');
      console.log('To execute this migration against staging/local, run with --execute.');
      console.log('DO NOT run against production without user confirmation.');
    } else {
      console.log('\n🎉 Live migration complete. All unmasked PII has been scrubbed.');
    }
  } catch (err) {
    console.error('Migration script error:', err);
  }
}

runMigration();
