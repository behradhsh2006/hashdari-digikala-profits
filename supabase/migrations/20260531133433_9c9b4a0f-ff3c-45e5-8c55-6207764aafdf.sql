-- Tighten SELECT policies to prevent cross-user data exposure
DROP POLICY IF EXISTS products_select_auth ON public.products;
CREATE POLICY products_select_own_or_manager ON public.products
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid()
         OR has_role(auth.uid(), 'super_admin'::app_role)
         OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS tx_select_auth ON public.sale_transactions;
CREATE POLICY tx_select_own_or_manager ON public.sale_transactions
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid()
         OR has_role(auth.uid(), 'super_admin'::app_role)
         OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS settings_read_all_auth ON public.app_settings;
CREATE POLICY settings_read_admin ON public.app_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role)
         OR has_role(auth.uid(), 'manager'::app_role));