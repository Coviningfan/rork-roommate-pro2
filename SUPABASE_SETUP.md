# Supabase Database Setup & RLS Policies

## Required Database Schema

Run these SQL commands in your Supabase SQL Editor to set up the complete database:

```sql
-- Create apartments table
CREATE TABLE IF NOT EXISTS apartments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Apartment',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create apartment_members table (optional but recommended)
CREATE TABLE IF NOT EXISTS apartment_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(apartment_id, user_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  signed BOOLEAN DEFAULT FALSE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  recurring TEXT CHECK (recurring IN ('daily', 'weekly', 'monthly')),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT CHECK (category IN ('rent', 'utilities', 'groceries', 'other')),
  split TEXT DEFAULT 'equal' CHECK (split IN ('equal', 'custom')),
  split_details JSONB,
  settled BOOLEAN DEFAULT FALSE,
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  arrival_date TIMESTAMP WITH TIME ZONE,
  departure_date TIMESTAMP WITH TIME ZONE,
  purpose TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create RPC function to find apartments by code (bypasses RLS)
CREATE OR REPLACE FUNCTION find_apartment_by_code(search_code TEXT)
RETURNS TABLE(id UUID, room_code TEXT, user_id UUID, name TEXT, created_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.room_code, a.user_id, a.name, a.created_at
  FROM apartments a
  WHERE a.room_code = search_code;
END;
$$;
```

## Row Level Security (RLS) Policies

Run these commands to enable RLS and create the necessary policies:

```sql
-- Enable RLS on all tables
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Apartments policies
CREATE POLICY "Users can view apartments they own or are members of" ON apartments
FOR SELECT USING (
  user_id = auth.uid() OR
  id IN (SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create apartments" ON apartments
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own apartments" ON apartments
FOR UPDATE USING (user_id = auth.uid());

-- Apartment members policies
CREATE POLICY "Users can view apartment members for their apartments" ON apartment_members
FOR SELECT USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add members to their apartments" ON apartment_members
FOR INSERT WITH CHECK (
  apartment_id IN (SELECT id FROM apartments WHERE user_id = auth.uid()) OR
  user_id = auth.uid()
);

CREATE POLICY "Users can remove themselves or owners can remove members" ON apartment_members
FOR DELETE USING (
  user_id = auth.uid() OR
  apartment_id IN (SELECT id FROM apartments WHERE user_id = auth.uid())
);

-- Documents policies
CREATE POLICY "Users can view documents from their apartments" ON documents
FOR SELECT USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert documents for their apartments" ON documents
FOR INSERT WITH CHECK (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update documents from their apartments" ON documents
FOR UPDATE USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Chores policies
CREATE POLICY "Users can view chores from their apartments" ON chores
FOR SELECT USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create chores for their apartments" ON chores
FOR INSERT WITH CHECK (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update chores from their apartments" ON chores
FOR UPDATE USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Expenses policies
CREATE POLICY "Users can view expenses from their apartments" ON expenses
FOR SELECT USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create expenses for their apartments" ON expenses
FOR INSERT WITH CHECK (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update expenses from their apartments" ON expenses
FOR UPDATE USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Guests policies
CREATE POLICY "Users can view guests from their apartments" ON guests
FOR SELECT USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create guest requests for their apartments" ON guests
FOR INSERT WITH CHECK (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update guests from their apartments" ON guests
FOR UPDATE USING (
  apartment_id IN (
    SELECT id FROM apartments WHERE user_id = auth.uid()
    UNION
    SELECT apartment_id FROM apartment_members WHERE user_id = auth.uid()
  )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications for any user" ON notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Storage policies for documents bucket
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
```

## Setup Instructions

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Run the schema creation commands first**
4. **Then run the RLS policies commands**
5. **Verify all tables and policies are created**

After running these commands, your document upload should work properly!