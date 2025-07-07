const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://qafbcposwxopeoiuwyji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxOTc2OSwiZXhwIjoyMDYyNzk1NzY5fQ.Pql9g65Ri_76h9xbmfl7L5CSSgSQZ4pvsemnLtLGjag";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAuthUsers() {
  console.log('🔐 Checking Supabase auth.users table...\n');

  try {
    // Check auth.users table
    const { data: authUsers, error: authError, count: authCount } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    if (authError) {
      console.log('❌ Auth users table error:', authError.message);
    } else {
      console.log(`✅ Auth users table accessible: ${authCount} records`);
    }

    // Try to get a sample of auth users
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(5);

    if (sampleError) {
      console.log('❌ Error fetching sample users:', sampleError.message);
    } else if (sampleUsers && sampleUsers.length > 0) {
      console.log('\n📋 Sample auth users:');
      sampleUsers.forEach(user => {
        console.log(`- ${user.email} (${user.id})`);
      });
    } else {
      console.log('\n📋 No auth users found');
    }

    // Check if we can access the public.users table with actual data
    const { data: publicUsers, error: publicError, count: publicCount } = await supabase
      .from('users')
      .select('id, email, display_name, created_at')
      .limit(5);

    if (publicError) {
      console.log('❌ Public users table error:', publicError.message);
    } else {
      console.log(`\n📋 Public users table: ${publicCount} records`);
      if (publicUsers && publicUsers.length > 0) {
        console.log('Sample public users:');
        publicUsers.forEach(user => {
          console.log(`- ${user.email} (${user.id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking auth users:', error);
  }
}

checkAuthUsers().catch(console.error); 