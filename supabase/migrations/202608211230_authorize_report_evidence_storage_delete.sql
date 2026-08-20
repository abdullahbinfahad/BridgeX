DROP FUNCTION IF EXISTS public.close_bridgex_incident_report(uuid);

DROP POLICY IF EXISTS request_media_delete_admin_report_evidence ON storage.objects;
CREATE POLICY request_media_delete_admin_report_evidence
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'request-media'
  AND public.is_bridgex_admin()
  AND name LIKE '%/reports/%'
);
