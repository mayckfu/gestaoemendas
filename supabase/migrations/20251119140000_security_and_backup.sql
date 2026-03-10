-- Create Security Notifications Table
CREATE TABLE IF NOT EXISTS public.security_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    message text NOT NULL,
    severity text NOT NULL DEFAULT 'INFO',
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create Backup Logs Table
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status text NOT NULL,
    type text NOT NULL,
    size text,
    url text,
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    initiated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Security Notifications
CREATE POLICY "Admins can view all security notifications" 
ON public.security_notifications FOR SELECT 
USING (public.get_user_role() = 'ADMIN');

CREATE POLICY "Admins can update security notifications" 
ON public.security_notifications FOR UPDATE 
USING (public.get_user_role() = 'ADMIN');

-- Policies for Backup Logs
CREATE POLICY "Admins can view backup logs" 
ON public.backup_logs FOR SELECT 
USING (public.get_user_role() = 'ADMIN');

CREATE POLICY "Admins can insert backup logs" 
ON public.backup_logs FOR INSERT 
WITH CHECK (public.get_user_role() = 'ADMIN');

-- Function to log security notification (accessible by authenticated users for logging failures if needed, or system)
CREATE OR REPLACE FUNCTION public.log_security_notification(
    p_type text,
    p_message text,
    p_severity text,
    p_user_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.security_notifications (type, message, severity, user_id)
    VALUES (p_type, p_message, p_severity, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon/authenticated
GRANT EXECUTE ON FUNCTION public.log_security_notification TO anon, authenticated, service_role;

-- Trigger for Critical Changes in Audit Logs
CREATE OR REPLACE FUNCTION public.trigger_critical_security_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Alert on DELETE actions or UPDATEs on sensitive tables
    IF NEW.action = 'DELETE' OR (NEW.table_name IN ('users', 'cargos', 'profiles') AND NEW.action = 'UPDATE') THEN
        INSERT INTO public.security_notifications (type, message, severity, user_id)
        VALUES (
            'CRITICAL_CHANGE',
            'Ação crítica detectada: ' || NEW.action || ' na tabela ' || NEW.table_name,
            'WARNING',
            NEW.changed_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_critical_change ON public.audit_logs;
CREATE TRIGGER on_critical_change
AFTER INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.trigger_critical_security_alert();
