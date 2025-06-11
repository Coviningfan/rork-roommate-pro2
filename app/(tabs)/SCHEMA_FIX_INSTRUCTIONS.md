# Database Schema Fix Instructions

If you're experiencing issues with document uploads, modification requests, or other document management features, you may need to update your database schema.

## Common Errors

- `Could not find the 'uploader_id' column of 'documents' in the schema cache`
- `Could not find the 'size' column of 'documents' in the schema cache`
- `relation "public.modification_requests" does not exist`

## How to Fix

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the SQL from the file `COMPREHENSIVE_SCHEMA_FIX.sql` in the project root
4. Run the SQL in the Supabase SQL Editor
5. Restart your app

## What the Fix Does

The schema fix:

1. Adds missing columns to the documents table:
   - `uploader_id` - Links to the user who uploaded the document
   - `size` - Document file size
   - `type` - Document MIME type

2. Creates the modification_requests table for document change requests

3. Sets up proper Row Level Security (RLS) policies for documents and modification requests

4. Creates helper functions for checking table columns and user permissions

5. Sets up storage bucket policies for document uploads

## Manual Verification

After running the fix, you can verify it worked by:

1. Checking if the documents table has the required columns:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'documents';
   ```

2. Checking if the modification_requests table exists:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'modification_requests'
   );
   ```

3. Checking if the RPC function exists:
   ```sql
   SELECT EXISTS (
     SELECT FROM pg_proc 
     WHERE proname = 'get_table_columns'
   );
   ```

## Troubleshooting

If you continue to experience issues after running the fix:

1. Check the Supabase logs for any SQL errors
2. Make sure your user has the necessary permissions
3. Try running the individual sections of the SQL fix separately
4. Contact support if problems persist