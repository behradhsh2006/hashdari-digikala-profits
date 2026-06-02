-- Per-user API credentials: add owner_id and update RLS
ALTER TABLE public.api_credentials
  ADD COLUMN IF NOT EXISTS owner_id uuid;

CREATE INDEX IF NOT EXISTS api_credentials_owner_idx
  ON public.api_credentials (owner_id, provider);

-- Replace policy: super_admin can manage everything, plus each user manages their own rows
DROP POLICY IF EXISTS vault_admin_only ON public.api_credentials;

CREATE POLICY vault_admin_all
  ON public.api_credentials
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY vault_owner_all
  ON public.api_credentials
  FOR ALL
  TO authenticated
  USING (owner_id IS NOT NULL AND owner_id = auth.uid())
  WITH CHECK (owner_id IS NOT NULL AND owner_id = auth.uid());

-- Allow any authenticated user to READ master (owner_id IS NULL) creds as fallback
CREATE POLICY vault_master_read
  ON public.api_credentials
  FOR SELECT
  TO authenticated
  USING (owner_id IS NULL);
