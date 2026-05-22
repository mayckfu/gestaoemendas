DO $$
DECLARE
  r record;
  v_session_id uuid;
BEGIN
  IF to_regclass('public.laura_conversations') IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT DISTINCT user_id
    FROM public.laura_conversations
  LOOP
    SELECT id
    INTO v_session_id
    FROM public.chat_sessions
    WHERE user_id = r.user_id
      AND title = 'Conversa migrada da Laura'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_session_id IS NULL THEN
      INSERT INTO public.chat_sessions (user_id, title, active_context)
      VALUES (r.user_id, 'Conversa migrada da Laura', '{"legacy_source":"laura_conversations"}'::jsonb)
      RETURNING id INTO v_session_id;
    END IF;

    INSERT INTO public.chat_messages (
      session_id,
      user_id,
      role,
      content,
      active_context,
      sources_used,
      created_at
    )
    SELECT
      v_session_id,
      c.user_id,
      c.role,
      c.content,
      '{}'::jsonb,
      '["legacy_laura_conversations"]'::jsonb,
      c.created_at
    FROM public.laura_conversations c
    WHERE c.user_id = r.user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.chat_messages m
        WHERE m.user_id = c.user_id
          AND m.role = c.role
          AND m.content = c.content
          AND m.created_at = c.created_at
      );
  END LOOP;
END $$;

SELECT
  (SELECT count(*) FROM public.chat_sessions) AS chat_sessions,
  (SELECT count(*) FROM public.chat_messages) AS chat_messages;
