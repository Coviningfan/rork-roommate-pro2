-- URGENT FIX: Run this in your Supabase SQL Editor to fix document uploads

-- First, check if RLS is enabled on documents table and disable it temporarily
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting documents (users can insert documents for their apartments)
CREATE POLICY "Users can insert documents for their apartments" ON documents
FOR INSERT WITH CHECK (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Create policy for selecting documents (users can view documents from their apartments)
CREATE POLICY "Users can view documents from their apartments" ON documents
FOR SELECT USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Create policy for updating documents (users can update documents from their apartments)
CREATE POLICY "Users can update documents from their apartments" ON documents
FOR UPDATE USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Storage bucket policies for the documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);