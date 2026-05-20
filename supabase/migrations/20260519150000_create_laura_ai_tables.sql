-- Laura AI: conversations, persistent memories, and learning suggestions.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.laura_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.laura_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('preference', 'rule', 'synonym', 'decision', 'follow_up', 'correction')),
  content text NOT NULL,
  source_message_id uuid NULL REFERENCES public.laura_conversations(id) ON DELETE SET NULL,
  importance integer NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.laura_learning_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_type text NOT NULL CHECK (suggested_type IN ('preference', 'rule', 'synonym', 'decision', 'follow_up', 'correction')),
  suggested_content text NOT NULL,
  reason text NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_laura_conversations_user_created_at
  ON public.laura_conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_laura_memories_user_status_importance
  ON public.laura_memories(user_id, status, importance DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_laura_learning_suggestions_user_status_created_at
  ON public.laura_learning_suggestions(user_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_laura_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_laura_memories_updated_at ON public.laura_memories;
CREATE TRIGGER update_laura_memories_updated_at
  BEFORE UPDATE ON public.laura_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_laura_updated_at();

ALTER TABLE public.laura_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laura_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laura_learning_suggestions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.laura_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.laura_memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.laura_learning_suggestions TO authenticated;

DROP POLICY IF EXISTS "Laura conversations select own or admin" ON public.laura_conversations;
CREATE POLICY "Laura conversations select own or admin"
ON public.laura_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura conversations insert own" ON public.laura_conversations;
CREATE POLICY "Laura conversations insert own"
ON public.laura_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura conversations update own or admin" ON public.laura_conversations;
CREATE POLICY "Laura conversations update own or admin"
ON public.laura_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN')
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura conversations delete own or admin" ON public.laura_conversations;
CREATE POLICY "Laura conversations delete own or admin"
ON public.laura_conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura memories select own or admin" ON public.laura_memories;
CREATE POLICY "Laura memories select own or admin"
ON public.laura_memories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura memories insert own" ON public.laura_memories;
CREATE POLICY "Laura memories insert own"
ON public.laura_memories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura memories update own or admin" ON public.laura_memories;
CREATE POLICY "Laura memories update own or admin"
ON public.laura_memories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN')
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura memories delete own or admin" ON public.laura_memories;
CREATE POLICY "Laura memories delete own or admin"
ON public.laura_memories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura suggestions select own or admin" ON public.laura_learning_suggestions;
CREATE POLICY "Laura suggestions select own or admin"
ON public.laura_learning_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura suggestions insert own" ON public.laura_learning_suggestions;
CREATE POLICY "Laura suggestions insert own"
ON public.laura_learning_suggestions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura suggestions update own or admin" ON public.laura_learning_suggestions;
CREATE POLICY "Laura suggestions update own or admin"
ON public.laura_learning_suggestions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN')
WITH CHECK (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura suggestions delete own or admin" ON public.laura_learning_suggestions;
CREATE POLICY "Laura suggestions delete own or admin"
ON public.laura_learning_suggestions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.get_user_role() = 'ADMIN');
