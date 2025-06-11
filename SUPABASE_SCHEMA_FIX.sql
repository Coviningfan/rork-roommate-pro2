-- CRITICAL FIX: Add missing uploader_id column to documents table
-- Run this in your Supabase SQL Editor to fix the schema issue

-- Step 1: Add the missing uploader_id column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update existing documents to have uploader_id (set to apartment owner for existing docs)
UPDATE documents 
SET uploader_id = (
  SELECT user_id FROM apartments WHERE apartments.id = documents.apartment_id
)
WHERE uploader_id IS NULL;

-- Step 3: Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can insert documents for accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can view documents from accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can update documents from accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can delete documents from accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can insert documents for their apartments" ON documents;
DROP POLICY IF EXISTS "Users can view documents from their apartments" ON documents;
DROP POLICY IF EXISTS "Users can update documents from their apartments" ON documents;

-- Step 4: Create apartment access function
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
  
  -- Check if user is a member of the apartment
  IF EXISTS (
    SELECT 1 FROM apartment_members 
    WHERE apartment_id = apartment_uuid AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Step 5: Create new comprehensive policies
CREATE POLICY "Users can insert documents for accessible apartments" ON documents
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id) AND
  uploader_id = auth.uid()
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

-- Special delete policy: only uploader or apartment owner can delete pending documents
CREATE POLICY "Users can delete pending documents they uploaded or own apartment" ON documents
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  signed = false AND
  (
    uploader_id = auth.uid() OR
    apartment_id IN (SELECT id FROM apartments WHERE user_id = auth.uid())
  )
);

-- Step 6: Create modification_requests table
CREATE TABLE IF NOT EXISTS modification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on modification_requests
ALTER TABLE modification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for modification_requests
CREATE POLICY "Users can create modification requests for accessible apartments" ON modification_requests
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id) AND
  requested_by = auth.uid()
);

CREATE POLICY "Users can view modification requests from accessible apartments" ON modification_requests
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  user_has_apartment_access(apartment_id)
);

CREATE POLICY "Apartment owners can update modification requests" ON modification_requests
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  apartment_id IN (SELECT id FROM apartments WHERE user_id = auth.uid())
);

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION user_has_apartment_access(UUID) TO authenticated;

-- Step 8: Ensure storage policies exist
DROP POLICY IF EXISTS "Authenticated users can upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from documents bucket" ON storage.objects;

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

-- Verification: Check if everything is set up correctly
SELECT 'Documents table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents';

SELECT 'Documents policies:' as info;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'documents';