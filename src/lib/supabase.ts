import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a dummy client if keys are missing to prevent crash, but log error
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder-project.supabase.co', 'placeholder-key');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('تحذير: مفاتيح Supabase غير موجودة. لن تعمل قاعدة البيانات بشكل صحيح.');
}
