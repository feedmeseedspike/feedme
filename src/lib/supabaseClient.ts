import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qafbcposwxopeoiuwyji.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxOTc2OSwiZXhwIjoyMDYyNzk1NzY5fQ.Pql9g65Ri_76h9xbmfl7L5CSSgSQZ4pvsemnLtLGjag";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
