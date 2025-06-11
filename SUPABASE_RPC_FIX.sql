-- Drop the existing function first
DROP FUNCTION IF EXISTS find_apartment_by_code(text);

-- Recreate the function with correct return type
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