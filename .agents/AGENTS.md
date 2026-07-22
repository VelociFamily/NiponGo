# Database Design and Schema Migration Rules

- Do not use string-serialization hacks (such as serializing JSON metadata into string/text columns like `name` or `details`) to store structured data.
- When schema changes are required, always design proper database columns.
- Write a clean SQL migration script (e.g. in `supabase/migrations/`) and ask the user to execute it in the Supabase SQL Editor.
- The user is happy to run the migration scripts directly in Supabase.
