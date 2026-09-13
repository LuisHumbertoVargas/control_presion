import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://uazlzqlxlcydeygpmreo.supabase.co";
const supabaseKey = "sb_publishable_NKESrfYA2Shu3_Xw4xsZ8g_vAAiIGiveyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhemx6cWx4bGN5ZGV5Z3BtcmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDk5MDIsImV4cCI6MjEwNDcyNTkwMn0.IBWmwkBRmDj_pl8ByEb6tEN2-aEQOEyncjqLf_UurXk"; // No uses service_role

export const supabase = createClient(supabaseUrl, supabaseKey);