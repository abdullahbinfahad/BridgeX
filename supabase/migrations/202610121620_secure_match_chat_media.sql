BEGIN;

-- Chat media is stored user-scoped so uploads cannot be confused with public post media.
-- Path format: <authenticated-user-id>/chat/<match-id>/<random-file>.jpg
DROP POLICY IF EXISTS request_media_chat_upload_participant ON storage.objects;
CREATE POLICY request_media_chat_upload_participant
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-media'
  AND name LIKE auth.uid()::text || '/chat/%'
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = split_part(name, '/', 3)::uuid
      AND m.status IN ('active', 'completed', 'disputed')
      AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())
  )
);

DROP POLICY IF EXISTS request_media_chat_read_participant ON storage.objects;
CREATE POLICY request_media_chat_read_participant
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'request-media'
  AND name LIKE '%/chat/%'
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = split_part(name, '/', 3)::uuid
      AND m.status IN ('active', 'completed', 'disputed')
      AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())
  )
);

COMMIT;
