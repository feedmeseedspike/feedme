import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qafbcposwxopeoiuwyji.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTk3NjksImV4cCI6MjA2Mjc5NTc2OX0.AItxs3-zqep_CpmqFcs9ZhjxkkSGBcoeII7wXcW8hLY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 