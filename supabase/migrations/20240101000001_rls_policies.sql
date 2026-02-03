-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Boards policies
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

-- Board members policies
CREATE POLICY "Users can view board members of their boards"
  ON board_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_members.board_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT board_id FROM board_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Board owners can manage members"
  ON board_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_members.board_id AND owner_id = auth.uid()
    )
  );

-- Presets policies (public read)
CREATE POLICY "Everyone can view presets"
  ON presets FOR SELECT
  USING (true);

-- Only admins can modify presets
CREATE POLICY "Admins can manage presets"
  ON presets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Models policies (public read)
CREATE POLICY "Everyone can view models"
  ON models FOR SELECT
  USING (true);

-- Only admins can modify models
CREATE POLICY "Admins can manage models"
  ON models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Generations policies
CREATE POLICY "Users can view their own generations"
  ON generations FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create generations"
  ON generations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own generations"
  ON generations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own generations"
  ON generations FOR DELETE
  USING (owner_id = auth.uid());

-- Admins can view all generations
CREATE POLICY "Admins can view all generations"
  ON generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assets policies
CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  USING (owner_id = auth.uid());

-- Credit accounts policies
CREATE POLICY "Users can view their own credit account"
  ON credit_accounts FOR SELECT
  USING (owner_id = auth.uid());

-- Credit accounts updates are handled by RPC functions (SECURITY DEFINER)
-- No direct UPDATE policy needed

-- Credit ledger policies
CREATE POLICY "Users can view their own ledger entries"
  ON credit_ledger FOR SELECT
  USING (owner_id = auth.uid());

-- Credit ledger inserts are handled by RPC functions (SECURITY DEFINER)
-- No direct INSERT policy needed

-- Admin settings policies
CREATE POLICY "Admins can view admin settings"
  ON admin_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin settings"
  ON admin_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Provider tasks policies
CREATE POLICY "Users can view provider tasks for their generations"
  ON provider_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE id = provider_tasks.generation_id AND owner_id = auth.uid()
    )
  );

-- Provider tasks inserts/updates are handled by Edge Functions (service role)

-- Storage bucket RLS policies
-- Note: Storage policies are created via Supabase Dashboard or SQL
-- These policies ensure users can only upload to their own paths

-- Policy: Users can upload files to their own paths in uploads bucket
CREATE POLICY "Users can upload to their own paths"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view files in their own paths
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update files in their own paths
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete files in their own paths
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Similar policies for outputs bucket
CREATE POLICY "Users can upload to their own paths in outputs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'outputs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files in outputs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'outputs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
