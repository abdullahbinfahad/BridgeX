-- Keep legacy image_path support while enabling ordered, multi-file post galleries.
ALTER TABLE public.send_requests
  ADD COLUMN IF NOT EXISTS media_paths jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.carry_listings
  ADD COLUMN IF NOT EXISTS media_paths jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS send_requests_media_paths_gin
  ON public.send_requests USING gin (media_paths);

CREATE INDEX IF NOT EXISTS carry_listings_media_paths_gin
  ON public.carry_listings USING gin (media_paths);

DROP POLICY IF EXISTS request_media_read_when_request_open ON storage.objects;

CREATE POLICY request_media_read_when_open_post
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'request-media'
    AND (
      EXISTS (
        SELECT 1
        FROM public.send_requests request
        WHERE request.status = 'open'
          AND (request.image_path = name OR request.media_paths ? name)
      )
      OR EXISTS (
        SELECT 1
        FROM public.carry_listings listing
        WHERE listing.status = 'open'
          AND listing.media_paths ? name
      )
    )
  );
