// Mentor map: Supabase client singleton.
// Why it exists: Centralizes URL/key/env config and exports shared table constants.
// Used by: All pages/components that read or write Supabase data.
import { createClient } from '@supabase/supabase-js';

// Mentor tip:
// In frontend apps, always use the PUBLIC anon key, never a service role key.
// Service role keys must stay server-side only.
const URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://gcmczxaknboyhutvabyh.supabase.co';
const API_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_r-R0WxhbQZfS5_IhLcx3uw_5nYWsCpY';

// Centralizing table/bucket names prevents "string typo bugs" across pages.
export const CREWMATES_TABLE = import.meta.env.VITE_SUPABASE_TABLE ?? 'Crewmates';
export const POSTS_TABLE = import.meta.env.VITE_SUPABASE_POSTS_TABLE ?? 'Posts';
export const COMMENTS_TABLE = import.meta.env.VITE_SUPABASE_COMMENTS_TABLE ?? 'Comments';
export const MEDIA_BUCKET = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET ?? 'post-media';

// Single shared client instance keeps connection usage predictable.
export const supabase = createClient(URL, API_KEY);
