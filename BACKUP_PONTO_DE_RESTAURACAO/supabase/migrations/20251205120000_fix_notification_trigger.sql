-- Update the trigger function to match the specific requirements for 'PROPOSTA_PAGA' notifications
CREATE OR REPLACE FUNCTION public.handle_new_emenda_status()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if status changed to PROPOSTA_PAGA
  IF (OLD.status_interno IS DISTINCT FROM NEW.status_interno) AND (NEW.status_interno = 'PROPOSTA_PAGA') THEN
    -- Create notification for all active users
    FOR user_record IN SELECT id FROM public.profiles WHERE status = 'ATIVO' LOOP
      INSERT INTO public.notifications (user_id, emenda_id, message, is_read, created_at)
      VALUES (
        user_record.id, 
        NEW.id, 
        'A emenda ' || NEW.numero_emenda || ' foi marcada como paga.', 
        FALSE, 
        NOW()
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is attached to the emendas table
DROP TRIGGER IF EXISTS trg_emenda_status_paga_notification ON public.emendas;

CREATE TRIGGER trg_emenda_status_paga_notification
AFTER UPDATE ON public.emendas
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_emenda_status();
