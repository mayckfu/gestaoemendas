-- Drop previous restrictive or potentially failing policies
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;

-- Re-create Read Policy
CREATE POLICY "Anyone can read system settings" 
ON public.system_settings FOR SELECT 
USING (true);

-- Re-create Admin Write Policy using robust string coercion (::text)
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings FOR ALL 
TO authenticated
USING (public.get_user_role()::text = 'ADMIN')
WITH CHECK (public.get_user_role()::text = 'ADMIN');
