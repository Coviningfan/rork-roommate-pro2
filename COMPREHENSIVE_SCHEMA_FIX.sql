-- COMPREHENSIVE SCHEMA FIX FOR DOCUMENT UPLOAD ISSUES
-- Run this in your Supabase SQL Editor to fix all schema problems

-- Step 1: Add missing columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS size BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Step 2: Add missing columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 3: Update existing documents to have uploader_id (set to apartment owner for existing docs)
UPDATE documents 
SET uploader_id = (
  SELECT user_id FROM apartments WHERE apartments.id = documents.apartment_id
)
WHERE uploader_id IS NULL;

-- Step 4: Create modification_requests table
CREATE TABLE IF NOT EXISTS modification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create signing_sessions table for PDF signing
CREATE TABLE IF NOT EXISTS signing_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  signature_positions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Step 6: Enable RLS on all tables
ALTER TABLE modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_sessions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create apartment access function
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
  
  -- Check if user is a member of the apartment (if table exists)
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

-- Step 8: Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can insert documents for accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can view documents from accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can update documents from accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can delete documents from accessible apartments" ON documents;
DROP POLICY IF EXISTS "Users can insert documents for their apartments" ON documents;
DROP POLICY IF EXISTS "Users can view documents from their apartments" ON documents;
DROP POLICY IF EXISTS "Users can update documents from their apartments" ON documents;
DROP POLICY IF EXISTS "Users can delete pending documents they uploaded or own apartment" ON documents;

-- Step 9: Create new comprehensive policies for documents
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

-- Step 10: Create policies for modification_requests
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

-- Step 11: Create policies for signing_sessions
CREATE POLICY "Users can create signing sessions for accessible apartments" ON signing_sessions
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  document_id IN (
    SELECT id FROM documents WHERE user_has_apartment_access(apartment_id)
  )
);

CREATE POLICY "Users can view signing sessions for accessible apartments" ON signing_sessions
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  document_id IN (
    SELECT id FROM documents WHERE user_has_apartment_access(apartment_id)
  )
);

CREATE POLICY "Users can update their own signing sessions" ON signing_sessions
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  (
    signer_email = auth.email() OR
    document_id IN (
      SELECT id FROM documents WHERE user_has_apartment_access(apartment_id)
    )
  )
);

-- Step 12: Ensure storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from documents bucket" ON storage.objects;

-- Create storage policies
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

-- Step 13: Grant permissions
GRANT EXECUTE ON FUNCTION user_has_apartment_access(UUID) TO authenticated;

-- Step 14: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_apartment_id ON documents(apartment_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_signed ON documents(signed);
CREATE INDEX IF NOT EXISTS idx_modification_requests_apartment_id ON modification_requests(apartment_id);
CREATE INDEX IF NOT EXISTS idx_modification_requests_status ON modification_requests(status);
CREATE INDEX IF NOT EXISTS idx_signing_sessions_document_id ON signing_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_signing_sessions_status ON signing_sessions(status);

-- Verification: Check if everything is set up correctly
SELECT 'Documents table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents';

SELECT 'Modification requests table exists:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'modification_requests'
) as table_exists;

SELECT 'Signing sessions table exists:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'signing_sessions'
) as table_exists;

SELECT 'Documents policies:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'documents';

SELECT 'Storage policies:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';