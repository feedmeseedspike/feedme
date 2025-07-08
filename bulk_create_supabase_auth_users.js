const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qafbcposwxopeoiuwyji.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxOTc2OSwiZXhwIjoyMDYyNzk1NzY5fQ.Pql9g65Ri_76h9xbmfl7L5CSSgSQZ4pvsemnLtLGjag';

const emails = JSON.parse(fs.readFileSync('order_emails.json', 'utf8'));
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  let created = 0, skipped = 0;
  for (const email of emails) {
    // Check if user exists
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ email });
    if (listError) {
      console.error(`Error checking user ${email}:`, listError.message);
      continue;
    }
    if (userList && userList.users && userList.users.length > 0) {
      console.log(`User exists: ${email}`);
      skipped++;
      continue;
    }
    // Create user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({ email });
    if (createError) {
      console.error(`Error creating user ${email}:`, createError.message);
      continue;
    }
    console.log(`Created user: ${email}`);
    created++;
  }
  console.log(`Done. Created: ${created}, Skipped (already existed): ${skipped}`);
}

main(); 