/**
 * IEDC BMCE Test Users Seeder (Sandbox / Staging)
 * Creates or ensures test student and admin accounts exist for automated verification.
 * Run with: npx tsx scripts/seed-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://quxwzqcbuksxxgpprztw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eHd6cWNidWtzeHhncHByenR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDY4NDUsImV4cCI6MjEwNDk4Mjg0NX0.P_NWWDiY8yWgmYpSq2ExWhjNad872EwsZGo7td20DLs';

// Safety Guard: Refuse to run against production
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'quxwzqcbuksxxgpprztw.supabase.co'];
const targetHost = new URL(SUPABASE_URL).hostname;

if (!ALLOWED_HOSTS.includes(targetHost)) {
  console.error(`[SAFETY ERROR] Refusing to seed test users on non-allowlisted host: ${targetHost}`);
  process.exit(1);
}

export const TEST_CREDENTIALS = {
  student: {
    email: 'test-student@bmce.ac.in',
    password: 'TestStudent#2026',
    fullName: 'Test Student Account',
    department: 'Computer Science & Engineering',
    role: 'Student'
  },
  admin: {
    email: 'test-admin@bmce.ac.in',
    password: 'TestAdmin#2026',
    fullName: 'Test Admin Evaluator',
    department: 'IEDC BMCE Nodal Center',
    role: 'Admin'
  }
};

async function seedUser(supabase: ReturnType<typeof createClient>, userConfig: typeof TEST_CREDENTIALS.student) {
  console.log(`Checking account: ${userConfig.email}...`);

  // Try signing in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: userConfig.email,
    password: userConfig.password
  });

  if (!signInError && signInData.user) {
    console.log(`  ✓ Account exists and verified for ${userConfig.email} (ID: ${signInData.user.id})`);
    return signInData.user;
  }

  // Account does not exist or password mismatch; attempt sign up
  console.log(`  Creating new test account for ${userConfig.email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: userConfig.email,
    password: userConfig.password,
    options: {
      data: {
        full_name: userConfig.fullName,
        role: userConfig.role,
        department: userConfig.department
      }
    }
  });

  if (signUpError) {
    console.warn(`  Notice for ${userConfig.email}: ${signUpError.message}`);
    return null;
  }

  console.log(`  ✓ Created test account for ${userConfig.email}`);
  return signUpData.user;
}

async function main() {
  console.log('======================================================');
  console.log(`IEDC BMCE: Seeding Test Personas on ${targetHost}`);
  console.log('======================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  await seedUser(supabase, TEST_CREDENTIALS.student);
  await seedUser(supabase, TEST_CREDENTIALS.admin);

  console.log('\nSeed check completed successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('seed-test-users.ts')) {
  main().catch(err => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
  });
}
