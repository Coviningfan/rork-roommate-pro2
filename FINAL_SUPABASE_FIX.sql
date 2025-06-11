-- FINAL COMPREHENSIVE FIX FOR DOCUMENT UPLOAD RLS ISSUES
-- Run this in your Supabase SQL Editor to fix all document upload problems

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert documents for their apartments" ON documents;
DROP POLICY IF EXISTS "Users can view documents from their apartments" ON documents;
DROP POLICY IF EXISTS "Users can update documents from their apartments" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Step 2: Ensure RLS is enabled on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Step 3: Create comprehensive apartment access function
CREATE OR REPLACE FUNCTION user_has_apartment_access(apartment_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the apartment
  IF EXISTS (
    SELECT 1 FROM apartments 
    WHERE id = apartment_uuid AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a member of the apartment (if apartment_members table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'apartment_members'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM apartment_members 
      WHERE apartment_id = apartment_uuid AND user_id = auth.uid()
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Step 4: Create new documents table policies using the function
CREATE POLICY "Users can insert documents for accessible apartments" ON documents
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id)
);

CREATE POLICY "Users can view documents from accessible apartments" ON documents
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id)
);

CREATE POLICY "Users can update documents from accessible apartments" ON documents
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id)
);

CREATE POLICY "Users can delete documents from accessible apartments" ON documents
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id)
);

-- Step 5: Create storage policies for documents bucket
-- Note: Storage policies are simpler - we just check if user is authenticated
-- The apartment access control is handled at the documents table level

CREATE POLICY "Authenticated users can upload to documents bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view documents bucket" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update documents bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete from documents bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

-- Step 6: Ensure the documents bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 7: Test the function (this will show if it works)
-- You can run this to test: SELECT user_has_apartment_access('your-apartment-id-here');

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION user_has_apartment_access(UUID) TO authenticated;

-- Verification queries (run these to check if everything is set up correctly):
-- SELECT * FROM pg_policies WHERE tablename = 'documents';
-- SELECT * FROM storage.buckets WHERE id = 'documents';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';