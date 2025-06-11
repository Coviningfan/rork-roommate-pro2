# Database Schema Fix Instructions

## CRITICAL: Run This SQL First

You need to run the `COMPREHENSIVE_SCHEMA_FIX.sql` file in your Supabase SQL Editor to fix all the database schema issues.

### Steps:

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire content of `COMPREHENSIVE_SCHEMA_FIX.sql`**
4. **Click "Run" to execute the SQL**

### What This Fix Does:

- ✅ Adds missing `uploader_id` column to documents table
- ✅ Adds missing `size` and `type` columns to documents table  
- ✅ Creates the `modification_requests` table
- ✅ Sets up proper Row Level Security (RLS) policies
- ✅ Creates storage bucket and policies for document uploads
- ✅ Updates existing documents with proper uploader_id values

### After Running the SQL:

1. **Refresh your app**
2. **Try uploading a document** - it should work now
3. **Test document deletion** - only pending documents can be deleted by uploader or apartment owner
4. **Test modification requests** - users can request changes to documents

### Verification:

The SQL includes verification queries at the end that will show you:
- All columns in the documents table
- Whether modification_requests table exists
- All active policies

If you see any errors, please share them and I'll help fix them!

## Features Now Available:

- ✅ **Document Upload**: Upload PDF files to your apartment
- ✅ **Document Viewing**: View PDFs in-app with WebView
- ✅ **Document Download**: Download documents to device
- ✅ **Document Sharing**: Share document URLs
- ✅ **Document Deletion**: Delete pending documents (uploader or apartment owner only)
- ✅ **Signature Requests**: Send documents for signature
- ✅ **Modification Requests**: Request changes to documents
- ✅ **Request Management**: Apartment owners can approve/reject modification requests

## Security Features:

- ✅ **Row Level Security**: Users can only access documents from their apartments
- ✅ **Upload Permissions**: Only apartment members can upload documents
- ✅ **Delete Permissions**: Only pending documents can be deleted, and only by uploader or apartment owner
- ✅ **Modification Requests**: Proper approval workflow for document changes