import { createClient } from "@supabase/supabase-js";

// Bu qiymatlar Supabase loyihangizdan olingan — o'zgartirmang.
const SUPABASE_URL = "https://cionhvjglfcylryavocx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DHhIOtBVWFV8rXMx7kTm2Q_NVsGNJcF";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
