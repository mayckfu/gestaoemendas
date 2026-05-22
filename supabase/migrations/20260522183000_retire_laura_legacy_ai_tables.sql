-- Retire Laura legacy AI tables after moving chat/memory flows to:
-- - chat_sessions
-- - chat_messages
-- - knowledge_notes
-- - ai_memory_events
--
-- This preserves legacy data by renaming old tables instead of dropping them.

DO $$
BEGIN
  IF to_regclass('public.laura_conversations') IS NOT NULL
     AND to_regclass('public.laura_conversations_legacy_20260522') IS NULL THEN
    ALTER TABLE public.laura_conversations RENAME TO laura_conversations_legacy_20260522;
  END IF;

  IF to_regclass('public.laura_memories') IS NOT NULL
     AND to_regclass('public.laura_memories_legacy_20260522') IS NULL THEN
    ALTER TABLE public.laura_memories RENAME TO laura_memories_legacy_20260522;
  END IF;

  IF to_regclass('public.laura_learning_suggestions') IS NOT NULL
     AND to_regclass('public.laura_learning_suggestions_legacy_20260522') IS NULL THEN
    ALTER TABLE public.laura_learning_suggestions RENAME TO laura_learning_suggestions_legacy_20260522;
  END IF;
END $$;
