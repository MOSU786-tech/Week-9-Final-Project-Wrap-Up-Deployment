// Mentor map: Converts raw Supabase errors into user-friendly messages.
// Why it exists: Prevents duplicate error handling logic across pages.
// Used by: Create, read, detail, and edit crewmate pages.
export const formatSupabaseError = (error) => {
  if (!error) {
    return 'Something went wrong.';
  }

  const message = error.message ?? 'Something went wrong.';

  if (/relation|column|schema/i.test(message)) {
    return 'Supabase could not find the expected database table or columns. Run the SQL in supabase-setup.sql, confirm the Posts/Comments/Crewmates tables exist, then refresh and try again.';
  }

  if (/bucket/i.test(message)) {
    return 'Supabase could not find the expected storage bucket. Create the post-media bucket in Supabase Storage, then try again.';
  }

  return message;
};
