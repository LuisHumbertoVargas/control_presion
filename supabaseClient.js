import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://uazlzqlxlcydeygpmreo.supabase.co";
const supabaseKey = "sb_publishable_NKESrfYA2Shu3_Xw4xsZ8g_vAAiIGiv"; // No uses service_role

export const supabase = createClient(supabaseUrl, supabaseKey);