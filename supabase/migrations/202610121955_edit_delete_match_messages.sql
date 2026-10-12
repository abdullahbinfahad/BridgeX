BEGIN;

ALTER TABLE public.match_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DROP POLICY IF EXISTS messages_update_own ON public.match_messages;
CREATE POLICY messages_update_own
ON public.match_messages
FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_messages.match_id
      AND m.status IN ('active', 'completed', 'disputed')
      AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())
  )
)
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS messages_delete_own ON public.match_messages;
CREATE POLICY messages_delete_own
ON public.match_messages
FOR DELETE TO authenticated
USING (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_messages.match_id
      AND m.status IN ('active', 'completed', 'disputed')
      AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())
  )
);

COMMIT;
