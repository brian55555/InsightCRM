// ======= Supabase Client (supabase.js) =======
import { createClient } from "@supabase/supabase-js";

// Use environment variables from Tempo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
