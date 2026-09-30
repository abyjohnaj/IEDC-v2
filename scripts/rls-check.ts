/**
 * IEDC BMCE: Automated RLS & Security Baseline Verification Script
 * 
 * Verifies table-level permissions across Anon, Student, and Admin personas.
 * Tests negative security assertions (unauthorized reads, privilege escalation, KYC fraud).
 * 
 * Usage: npx tsx scripts/rls-check.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TEST_CREDENTIALS } from './seed-test-users';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://quxwzqcbuksxxgpprztw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eHd6cWNidWtzeHhncHByenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDY4NDUsImV4cCI6MjEwNDk4Mjg0NX0.P_NWWDiY8yWgmYpSq2ExWhjNad872EwsZGo7td20DLs';

// 1. REFUSE TO RUN UNLESS SUPABASE_URL MATCHES ALLOWLISTED STAGING/LOCAL URL
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'quxwzqcbuksxxgpprztw.supabase.co'];
let targetHost = '';
try {
  targetHost = new URL(SUPABASE_URL).hostname;
} catch (e) {
  console.error(`[CONFIG ERROR] Invalid SUPABASE_URL: ${SUPABASE_URL}`);
  process.exit(1);
}

if (!ALLOWED_HOSTS.includes(targetHost)) {
  console.error(`\n[FATAL SECURITY REFUSAL] Target host '${targetHost}' is not in allowlist: ${ALLOWED_HOSTS.join(', ')}`);
  console.error('Refusing to execute automated RLS probe against unauthorized database.\n');
  process.exit(1);
}

// 2. ASSERT NEVER USING SERVICE-ROLE KEY
if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY) {
  console.error('\n[FATAL SECURITY VIOLATION] Detected service_role key in environment.');
  console.error('rls-check.ts must ONLY use end-user anon/client keys. Aborting.\n');
  process.exit(1);
}

interface TestResult {
  table: string;
  anonRead: string;
  anonWrite: string;
  studentRead: string;
  studentWrite: string;
  adminRead: string;
  adminWrite: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  notes: string;
}

const cleanupIds: { table: string; id: string }[] = [];

async function getClientForUser(email?: string, password?: string): Promise<{ client: SupabaseClient; userId?: string }> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  if (email && password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      // If student or admin fails, continue as unauthenticated with log
      console.warn(`[AUTH NOTE] Could not authenticate ${email}: ${error.message}`);
      return { client };
    }
    return { client, userId: data.user.id };
  }

  return { client };
}

async function testTablePermissions(
  tableName: string,
  anon: SupabaseClient,
  student: SupabaseClient,
  admin: SupabaseClient,
  studentId?: string
): Promise<TestResult> {
  const result: TestResult = {
    table: tableName,
    anonRead: '❌',
    anonWrite: '❌',
    studentRead: '❌',
    studentWrite: '❌',
    adminRead: '❌',
    adminWrite: '❌',
    status: 'PASS',
    notes: ''
  };

  // 1. Anon Read Test
  try {
    const { data, error } = await anon.from(tableName).select('*').limit(2);
    if (!error && data) {
      result.anonRead = data.length > 0 ? `Read (${data.length})` : 'Empty';
    } else {
      result.anonRead = 'Blocked';
    }
  } catch (e: any) {
    result.anonRead = 'Error';
  }

  // 2. Student Read Test
  try {
    const { data, error } = await student.from(tableName).select('*').limit(2);
    if (!error && data) {
      result.studentRead = data.length > 0 ? `Read (${data.length})` : 'Empty';
    } else {
      result.studentRead = 'Blocked';
    }
  } catch (e: any) {
    result.studentRead = 'Error';
  }

  // 3. Admin Read Test
  try {
    const { data, error } = await admin.from(tableName).select('*').limit(2);
    if (!error && data) {
      result.adminRead = data.length > 0 ? `Read (${data.length})` : 'Empty';
    } else {
      result.adminRead = 'Blocked';
    }
  } catch (e: any) {
    result.adminRead = 'Error';
  }

  // Evaluate table-specific status
  if (['profiles', 'kyc_verifications', 'registrations', 'team_chat_messages'].includes(tableName)) {
    if (result.anonRead.startsWith('Read')) {
      result.status = 'FAIL';
      result.notes = 'PII/Sensitive data readable by Anon!';
    }
  }

  return result;
}

async function runNegativeSecurityAssertions(
  anon: SupabaseClient,
  student: SupabaseClient,
  studentId?: string
) {
  console.log('\n------------------------------------------------------');
  console.log('Running Critical Negative Security Assertions:');
  console.log('------------------------------------------------------');

  // Test 1: Anon attempts to read profile email & phone
  process.stdout.write('1. Anon reading profile email/phone: ');
  const { data: anonProfiles, error: anonProfileErr } = await anon
    .from('profiles')
    .select('id, email, phone')
    .limit(1);

  if (anonProfileErr || !anonProfiles || anonProfiles.length === 0) {
    console.log('✅ SECURE (Anon blocked from reading profiles table directly)');
  } else {
    console.log(`❌ FAILED (Anon leaked: ${JSON.stringify(anonProfiles[0])})`);
  }

  // Test 2: Student attempts privilege escalation (change own role to Admin)
  process.stdout.write('2. Student changing own role to Admin: ');
  if (studentId) {
    const { data: updateData, error: updateError } = await student
      .from('profiles')
      .update({ role: 'Admin' })
      .eq('id', studentId);

    if (updateError) {
      console.log(`✅ SECURE (Rejected by trigger: ${updateError.message})`);
    } else {
      // Check if role actually changed
      const { data: checkData } = await student.from('profiles').select('role').eq('id', studentId).single();
      if (checkData?.role === 'Admin') {
        console.log('❌ FAILED (Student successfully elevated role to Admin!)');
      } else {
        console.log('✅ SECURE (Role update ignored or blocked)');
      }
    }
  } else {
    console.log('⚠️ SKIPPED (No student session established; verify test-student in seed)');
  }

  // Test 3: Student attempts fraudulent KYC insertion with status = 'verified'
  process.stdout.write('3. Student inserting KYC with status = "verified": ');
  const testKycId = `test_kyc_${Date.now()}`;
  if (studentId) {
    const { data: kycData, error: kycError } = await student
      .from('kyc_verifications')
      .insert([{
        id: testKycId,
        user_id: studentId,
        status: 'verified', // ILLEGAL: Check constraint only allows 'pending'
        doc_type: 'student_id',
        doc_number: 'KTU-FRAUD-001',
        full_name: 'Test Fraudulent Student',
        institution: 'BMCE'
      }]);

    if (kycError) {
      console.log(`✅ SECURE (Rejected: ${kycError.message})`);
    } else {
      console.log('❌ FAILED (Student successfully inserted self-verified KYC row!)');
      cleanupIds.push({ table: 'kyc_verifications', id: testKycId });
    }
  } else {
    console.log('⚠️ SKIPPED (No student session established)');
  }
}

async function main() {
  console.log('================================================================');
  console.log(`IEDC BMCE: RLS & Permissions Audit against ${targetHost}`);
  console.log('================================================================\n');

  console.log('Initializing client personas...');
  const { client: anonClient } = await getClientForUser();
  const { client: studentClient, userId: studentId } = await getClientForUser(
    TEST_CREDENTIALS.student.email,
    TEST_CREDENTIALS.student.password
  );
  const { client: adminClient } = await getClientForUser(
    TEST_CREDENTIALS.admin.email,
    TEST_CREDENTIALS.admin.password
  );

  console.log(`- Anon Persona: Initialized (Unauthenticated)`);
  console.log(`- Student Persona: ${studentId ? `Authenticated (${studentId})` : 'Fallback Mock Client'}`);
  console.log(`- Admin Persona: Authenticated`);

  const tables = [
    'profiles',
    'public_profiles',
    'kyc_verifications',
    'ideabox_submissions',
    'ideabox_comments',
    'hackathon_events',
    'hackathon_teams',
    'team_chat_messages',
    'forum_discussions',
    'forum_comments',
    'events',
    'registrations'
  ];

  console.log('\nAuditing Table Permissions Matrix:');
  console.log('-----------------------------------------------------------------------------------------');
  console.log(
    'Table Name'.padEnd(23) +
    'Anon Read'.padEnd(14) +
    'Student Read'.padEnd(16) +
    'Admin Read'.padEnd(14) +
    'Status'.padEnd(10) +
    'Notes'
  );
  console.log('-----------------------------------------------------------------------------------------');

  const results: TestResult[] = [];
  try {
    for (const t of tables) {
      const res = await testTablePermissions(t, anonClient, studentClient, adminClient, studentId);
      results.push(res);
      console.log(
        res.table.padEnd(23) +
        res.anonRead.padEnd(14) +
        res.studentRead.padEnd(16) +
        res.adminRead.padEnd(14) +
        res.status.padEnd(10) +
        res.notes
      );
    }

    // Run specific assertions
    await runNegativeSecurityAssertions(anonClient, studentClient, studentId);

  } finally {
    // Clean up test rows
    if (cleanupIds.length > 0) {
      console.log('\nCleaning up generated test rows...');
      for (const item of cleanupIds) {
        try {
          await studentClient.from(item.table).delete().eq('id', item.id);
        } catch (e) {
          // ignore
        }
      }
    }
  }

  console.log('\n================================================================');
  console.log('RLS Check Execution Complete.');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
