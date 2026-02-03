-- Fix RLS infinite recursion for board_members
-- The issue: board_members policy checks boards, boards policy checks board_members
-- Solution: Use SECURITY DEFINER function to break the recursion

-- Create helper function to check board access (SECURITY DEFINER breaks recursion)
CREATE OR REPLACE FUNCTION public.user_has_board_access(board_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = board_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = board_uuid AND user_id = user_uuid
  );
$$;

-- Drop and recreate board_members policies to use the helper function
DROP POLICY IF EXISTS "Users can view board members of their boards" ON board_members;
CREATE POLICY "Users can view board members of their boards"
  ON board_members FOR SELECT
  USING (public.user_has_board_access(board_id, auth.uid()));

-- Also fix boards policy to avoid recursion
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );
