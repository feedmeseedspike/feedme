const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fyldgskqxrfmrhyluxmw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bGRnc2txeHJmbXJoeWx1eG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk3NTc2NiwiZXhwIjoyMDY1NTUxNzY2fQ.Bd1xAR6fCom0HpcN7ngNP_MTI-gbsU-w1EzAjUFSrqE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupProfilesTable() {
    try {
        console.log('Setting up profiles table...');
        
        // Read SQL files
        const profilesTableSQL = fs.readFileSync('create_profiles_table.sql', 'utf8');
        const profileTriggerSQL = fs.readFileSync('create_profile_trigger.sql', 'utf8');
        
        // Execute profiles table creation
        console.log('Creating profiles table...');
        const { error: tableError } = await supabase.rpc('exec_sql', { sql: profilesTableSQL });
        
        if (tableError) {
            console.error('Error creating profiles table:', tableError);
            // Try alternative approach using direct SQL execution
            console.log('Trying alternative approach...');
            const { error: altError } = await supabase.from('profiles').select('*').limit(1);
            if (altError && altError.message.includes('does not exist')) {
                console.log('Profiles table does not exist. You need to run the SQL manually in Supabase dashboard.');
                console.log('Go to your Supabase dashboard > SQL Editor and run the contents of create_profiles_table.sql');
            }
        } else {
            console.log('Profiles table created successfully!');
        }
        
        // Execute trigger creation
        console.log('Creating profile trigger...');
        const { error: triggerError } = await supabase.rpc('exec_sql', { sql: profileTriggerSQL });
        
        if (triggerError) {
            console.error('Error creating profile trigger:', triggerError);
            console.log('You may need to run the trigger SQL manually in Supabase dashboard.');
        } else {
            console.log('Profile trigger created successfully!');
        }
        
        console.log('Setup complete!');
        
    } catch (error) {
        console.error('Setup failed:', error);
        console.log('\nManual setup required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of create_profiles_table.sql');
        console.log('4. Run the contents of create_profile_trigger.sql');
    }
}

setupProfilesTable(); 