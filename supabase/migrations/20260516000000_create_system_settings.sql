-- Create System Settings Table for Global Configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read system settings" 
ON public.system_settings FOR SELECT 
USING (true);

CREATE POLICY "Admins can update system settings" 
ON public.system_settings FOR UPDATE 
USING (public.get_user_role() = 'ADMIN');

CREATE POLICY "Admins can insert system settings" 
ON public.system_settings FOR INSERT 
WITH CHECK (public.get_user_role() = 'ADMIN');

-- Seed the initial visitor mode setting
INSERT INTO public.system_settings (key, value)
VALUES ('visitor_mode_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
