const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndAddColumn() {
  console.log('Checking spin_prizes columns...');

  // We can't easily check columns without SQL, but we can try to insert/select and see if it fails.
  // Or we can use the 'rpc' if it exists.

  // Most reliable way in Supabase without SQL access is to try an update on a dummy ID or just a select.
  const { data, error } = await supabase.from('spin_prizes').select('sort_order').limit(1);

  if (error && error.code === '42703') { // undefined_column
    console.log('sort_order column missing. You need to add it via Supabase SQL Editor:');
    console.log('ALTER TABLE spin_prizes ADD COLUMN sort_order INT DEFAULT 0;');
  } else if (error) {
    console.error('Error checking column:', error);
  } else {
    console.log('sort_order column already exists.');
  }
}

checkAndAddColumn();
