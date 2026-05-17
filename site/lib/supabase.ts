import { createClient } from '@supabase/supabase-js'

// Trim whitespace/newlines that can sneak into env vars from some hosting setups
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  { auth: { persistSession: false } }
)
