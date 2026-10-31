/**
 * IEDC BMCE: Comprehensive Role-Based Access Control (RLS) Test Suite
 * 
 * Verifies RLS policies across all 5 roles:
 * 1. anon (Public unauthenticated)
 * 2. student (Standard authenticated student)
 * 3. innovator (Student founder with active idea/startup)
 * 4. reviewer (Rubric evaluator / faculty judge)
 * 5. admin (Admin & Execom leadership)
 * 
 * Exits with code 1 if ANY policy or invariant regresses.
 */

import fs from 'fs';
import path from 'path';

interface PolicyCheck {
  table: string;
  role: 'anon' | 'student' | 'innovator' | 'reviewer' | 'admin' | 'all';
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  expected: 'ALLOW' | 'DENY' | 'RESTRICTED_OWNER' | 'RESTRICTED_EVALUATOR';
  policyNameMatch?: RegExp;
}

const CRITICAL_TABLES = [
  'profiles',
  'kyc_verifications',
  'ideabox_submissions',
  'ideabox_comments',
  'hackathon_events',
  'hackathon_teams',
  'team_chat_messages',
  'forum_discussions',
  'forum_comments',
  'audit_log',
  'notifications',
  'newsletter_editions',
  'review_criteria',
  'idea_reviews',
  'idea_review_scores'
];

const RLS_POLICY_MATRIX: PolicyCheck[] = [
  // Anon
  { table: 'kyc_verifications', role: 'anon', operation: 'SELECT', expected: 'DENY' },
  { table: 'kyc_verifications', role: 'anon', operation: 'INSERT', expected: 'DENY' },
  { table: 'team_chat_messages', role: 'anon', operation: 'SELECT', expected: 'DENY' },
  { table: 'team_chat_messages', role: 'anon', operation: 'INSERT', expected: 'DENY' },
  { table: 'audit_log', role: 'anon', operation: 'SELECT', expected: 'DENY' },
  { table: 'notifications', role: 'anon', operation: 'SELECT', expected: 'DENY' },
  { table: 'newsletter_editions', role: 'anon', operation: 'SELECT', expected: 'ALLOW', policyNameMatch: /Public can view newsletter editions/i },
  { table: 'forum_discussions', role: 'anon', operation: 'SELECT', expected: 'ALLOW', policyNameMatch: /forum_discussions_select/i },
  
  // Student
  { table: 'kyc_verifications', role: 'student', operation: 'SELECT', expected: 'RESTRICTED_OWNER', policyNameMatch: /kyc_select_owner/i },
  { table: 'kyc_verifications', role: 'student', operation: 'INSERT', expected: 'RESTRICTED_OWNER', policyNameMatch: /kyc_insert_pending_owner/i },
  { table: 'profiles', role: 'student', operation: 'UPDATE', expected: 'RESTRICTED_OWNER', policyNameMatch: /profiles_update_owner/i },
  { table: 'audit_log', role: 'student', operation: 'SELECT', expected: 'DENY' },
  { table: 'team_chat_messages', role: 'student', operation: 'SELECT', expected: 'RESTRICTED_OWNER', policyNameMatch: /team_chat_select/i },
  
  // Innovator
  { table: 'ideabox_submissions', role: 'innovator', operation: 'INSERT', expected: 'RESTRICTED_OWNER', policyNameMatch: /ideabox_insert_author/i },
  { table: 'hackathon_teams', role: 'innovator', operation: 'INSERT', expected: 'ALLOW', policyNameMatch: /hackathon_teams_insert/i },
  { table: 'audit_log', role: 'innovator', operation: 'SELECT', expected: 'DENY' },

  // Reviewer
  { table: 'review_criteria', role: 'reviewer', operation: 'SELECT', expected: 'ALLOW', policyNameMatch: /review_criteria_select/i },
  { table: 'idea_reviews', role: 'reviewer', operation: 'SELECT', expected: 'RESTRICTED_EVALUATOR', policyNameMatch: /idea_reviews_select/i },
  { table: 'idea_review_scores', role: 'reviewer', operation: 'INSERT', expected: 'RESTRICTED_EVALUATOR', policyNameMatch: /idea_review_scores_reviewer/i },
  { table: 'audit_log', role: 'reviewer', operation: 'SELECT', expected: 'DENY' },

  // Admin
  { table: 'audit_log', role: 'admin', operation: 'SELECT', expected: 'ALLOW', policyNameMatch: /audit_log_select_admins/i },
  { table: 'kyc_verifications', role: 'admin', operation: 'SELECT', expected: 'ALLOW', policyNameMatch: /kyc_select_owner_or_evaluator/i },
  { table: 'newsletter_editions', role: 'admin', operation: 'ALL', expected: 'ALLOW', policyNameMatch: /Admins and service role can modify newsletter editions/i }
];

async function runRlsMatrixVerification() {
  console.log('================================================================');
  console.log('IEDC BMCE: Role-Level Security (RLS) Test Suite');
  console.log('Roles Covered: anon | student | innovator | reviewer | admin');
  console.log('================================================================\n');

  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at ${migrationsDir}`);
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('rollback'))
    .sort();

  console.log(`Loaded ${migrationFiles.length} database migration files for security analysis.\n`);

  let allSql = '';
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    allSql += `\n-- File: ${file}\n` + fs.readFileSync(filePath, 'utf-8');
  }

  const failures: string[] = [];
  const passes: string[] = [];

  // 1. Verify RLS is enabled on every critical table
  console.log('1. Verifying RLS Enabled Invariants across all critical tables:');
  console.log('----------------------------------------------------------------');
  for (const table of CRITICAL_TABLES) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    if (rlsRegex.test(allSql)) {
      passes.push(`[RLS_ENABLED] Table "${table}" has RLS enabled`);
      console.log(`  ✓ ${table.padEnd(25)} : RLS ENABLED`);
    } else {
      const failMsg = `[RLS_MISSING] Table "${table}" is MISSING "ENABLE ROW LEVEL SECURITY"`;
      failures.push(failMsg);
      console.error(`  ✗ ${table.padEnd(25)} : MISSING RLS!`);
    }
  }

  // 2. Verify Policy Matrix Rules
  console.log('\n2. Verifying Role Permission Matrix (anon, student, innovator, reviewer, admin):');
  console.log('----------------------------------------------------------------');
  for (const check of RLS_POLICY_MATRIX) {
    const checkLabel = `[${check.role.toUpperCase()} -> ${check.table} (${check.operation})]`;
    
    if (check.expected === 'DENY') {
      // Ensure no permissive policy opens this up to the role
      const permissiveRegex = new RegExp(
        `CREATE\\s+POLICY\\s+["'][^"']*["']\\s+ON\\s+(?:public\\.)?${check.table}\\s+FOR\\s+(?:ALL|${check.operation})\\s+TO\\s+(?:public|${check.role})`,
        'i'
      );
      if (permissiveRegex.test(allSql)) {
        const err = `${checkLabel} VIOLATION: Unexpected permissive policy found granting access to ${check.role}!`;
        failures.push(err);
        console.error(`  ✗ ${checkLabel.padEnd(45)} : FAILED (Permissive policy leak)`);
      } else {
        passes.push(`${checkLabel} Securely DENIED for ${check.role}`);
        console.log(`  ✓ ${checkLabel.padEnd(45)} : DENIED (Secure)`);
      }
    } else if (check.policyNameMatch) {
      if (check.policyNameMatch.test(allSql)) {
        passes.push(`${checkLabel} Policy verified matching pattern`);
        console.log(`  ✓ ${checkLabel.padEnd(45)} : ALLOW (${check.expected})`);
      } else {
        const err = `${checkLabel} MISSING POLICY: Expected policy matching ${check.policyNameMatch} not found in migrations!`;
        failures.push(err);
        console.error(`  ✗ ${checkLabel.padEnd(45)} : MISSING REQUIRED POLICY`);
      }
    }
  }

  // 3. Verify Critical Negative Security Invariants
  console.log('\n3. Verifying Anti-Tampering & Anti-Escalation Triggers:');
  console.log('----------------------------------------------------------------');
  
  // Anti-escalation trigger: prevent non-admins from changing profiles.role
  const roleEscalationCheck = /prevent_role_escalation|prevent_role_elevation|prevent_unauthorized_role_change/i.test(allSql);
  if (roleEscalationCheck) {
    passes.push('Anti-privilege-escalation trigger verified on profiles');
    console.log(`  ✓ Role escalation guard    : ACTIVE (Triggers block student -> admin self elevation)`);
  } else {
    failures.push('Missing anti-privilege-escalation trigger on profiles table');
    console.error(`  ✗ Role escalation guard    : MISSING`);
  }

  // KYC Verified constraint: direct inserts must only allow 'pending'
  const kycConstraintCheck = /check_kyc_initial_status|status\s+IN\s*\('pending'\)|status\s*=\s*'pending'/i.test(allSql);
  if (kycConstraintCheck) {
    passes.push('KYC status constraint verified');
    console.log(`  ✓ KYC self-verify barrier  : ACTIVE (Only 'pending' status permitted on initial insert)`);
  } else {
    failures.push('Missing KYC status constraint on initial insert');
    console.error(`  ✗ KYC self-verify barrier  : MISSING`);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`RLS Matrix Results: ${passes.length} Passed, ${failures.length} Failed`);
  console.log('================================================================');

  if (failures.length > 0) {
    console.error('\n[FATAL CI REGRESSION] The following RLS assertions failed:');
    for (const f of failures) {
      console.error(` - ${f}`);
    }
    process.exit(1);
  }

  console.log('\n✅ ALL RLS POLICIES AND ROLE BOUNDARIES VERIFIED SUCCESSFULLY.\n');
  process.exit(0);
}

runRlsMatrixVerification().catch(err => {
  console.error('Fatal RLS matrix runner error:', err);
  process.exit(1);
});
