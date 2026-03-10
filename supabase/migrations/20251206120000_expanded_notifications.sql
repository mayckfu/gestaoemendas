-- Migration to expand notification system with triggers for Emendas, Anexos, and Pendencias

-- Drop existing trigger/function if they exist to avoid conflicts and redefine logic
DROP TRIGGER IF EXISTS trg_emenda_status_paga_notification ON public.emendas;
DROP FUNCTION IF EXISTS public.handle_new_emenda_status;

-- Create the main notification handler function
CREATE OR REPLACE FUNCTION public.handle_expanded_notifications()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  notification_msg TEXT;
  related_emenda_id UUID;
  emenda_numero TEXT;
BEGIN
  notification_msg := '';
  related_emenda_id := NULL;

  -- 1. Status Change in Emendas
  IF TG_TABLE_NAME = 'emendas' AND TG_OP = 'UPDATE' THEN
    IF OLD.status_interno IS DISTINCT FROM NEW.status_interno THEN
      notification_msg := 'A emenda ' || NEW.numero_emenda || ' teve seu status alterado para ' || NEW.status_interno;
      related_emenda_id := NEW.id;
    END IF;
  END IF;

  -- 2. New Attachment in Anexos
  IF TG_TABLE_NAME = 'anexos' AND TG_OP = 'INSERT' THEN
    SELECT numero_emenda INTO emenda_numero FROM public.emendas WHERE id = NEW.emenda_id;
    notification_msg := 'Novo anexo (' || NEW.filename || ') adicionado à emenda ' || emenda_numero;
    related_emenda_id := NEW.emenda_id;
  END IF;

  -- 3. Pendency Resolved in Pendencias
  IF TG_TABLE_NAME = 'pendencias' AND TG_OP = 'UPDATE' THEN
    IF OLD.resolvida = FALSE AND NEW.resolvida = TRUE THEN
       SELECT numero_emenda INTO emenda_numero FROM public.emendas WHERE id = NEW.emenda_id;
       notification_msg := 'Pendência "' || NEW.descricao || '" resolvida na emenda ' || emenda_numero;
       related_emenda_id := NEW.emenda_id;
    END IF;
  END IF;

  -- Insert notifications for all active users if a message was generated
  IF notification_msg != '' AND related_emenda_id IS NOT NULL THEN
    FOR user_record IN SELECT id FROM public.profiles WHERE status = 'ATIVO' LOOP
      INSERT INTO public.notifications (user_id, emenda_id, message, is_read, created_at)
      VALUES (user_record.id, related_emenda_id, notification_msg, FALSE, NOW());
    END LOOP;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers for each table

-- Trigger for Emendas Status Change
DROP TRIGGER IF EXISTS trg_notify_emenda_status ON public.emendas;
CREATE TRIGGER trg_notify_emenda_status
AFTER UPDATE ON public.emendas
FOR EACH ROW
EXECUTE FUNCTION public.handle_expanded_notifications();

-- Trigger for New Anexos
DROP TRIGGER IF EXISTS trg_notify_new_anexo ON public.anexos;
CREATE TRIGGER trg_notify_new_anexo
AFTER INSERT ON public.anexos
FOR EACH ROW
EXECUTE FUNCTION public.handle_expanded_notifications();

-- Trigger for Resolved Pendencias
DROP TRIGGER IF EXISTS trg_notify_pendency_resolved ON public.pendencias;
CREATE TRIGGER trg_notify_pendency_resolved
AFTER UPDATE ON public.pendencias
FOR EACH ROW
EXECUTE FUNCTION public.handle_expanded_notifications();
