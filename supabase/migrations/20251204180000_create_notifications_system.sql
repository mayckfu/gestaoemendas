-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emenda_id UUID NOT NULL REFERENCES public.emendas(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to handle new emenda status notifications
CREATE OR REPLACE FUNCTION handle_new_emenda_status()
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
        'Emenda ' || NEW.numero_emenda || ' foi marcada como Paga.', 
        FALSE, 
        NOW()
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for the function
DROP TRIGGER IF EXISTS trg_emenda_status_paga_notification ON public.emendas;
CREATE TRIGGER trg_emenda_status_paga_notification
AFTER UPDATE ON public.emendas
FOR EACH ROW
EXECUTE FUNCTION handle_new_emenda_status();
