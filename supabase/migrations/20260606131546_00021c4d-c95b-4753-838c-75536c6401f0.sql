DROP POLICY IF EXISTS vault_master_read ON public.api_credentials;
CREATE POLICY vault_master_read ON public.api_credentials
  FOR SELECT TO authenticated
  USING (owner_id IS NULL AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')));