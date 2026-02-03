-- Complete fix for RLS recursion in boards/board_members
-- This migration drops all existing policies and recreates them correctly

-- Step 1: Drop ALL existing policies for boards and board_members
DROP POLICY IF EXISTS "Users can view their own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Users can create boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;

DROP POLICY IF EXISTS "Users can view board members of their boards" ON board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON board_members;

-- Step 2: Create helper function (SECURITY DEFINER breaks recursion)
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

-- Step 3: Recreate boards policies (without recursion)
CREATE POLICY "Users can view their own boards"
  ON boards FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (owner_id = auth.uid());

-- Step 4: Recreate board_members policies (using helper function to avoid recursion)
CREATE POLICY "Users can view board members of their boards"
  ON board_members FOR SELECT
  USING (public.user_has_board_access(board_id, auth.uid()));

CREATE POLICY "Board owners can manage members"
  ON board_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_members.board_id AND owner_id = auth.uid()
    )
  );
