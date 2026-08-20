CREATE OR REPLACE FUNCTION public.close_bridgex_incident_report(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_reporter_id uuid;
  v_paths jsonb;
  v_path text;
BEGIN
  IF NOT public.is_bridgex_admin() THEN
    RAISE EXCEPTION 'Only an administrator can close a BridgeX safety report.';
  END IF;

  SELECT reporter_id, coalesce(evidence_paths, '[]'::jsonb)
  INTO v_reporter_id, v_paths
  FROM public.incident_reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Safety report not found.';
  END IF;

  FOR v_path IN SELECT value FROM jsonb_array_elements_text(v_paths) LOOP
    IF v_path LIKE v_reporter_id::text || '/reports/%' THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'request-media' AND name = v_path;
    END IF;
  END LOOP;

  UPDATE public.incident_reports
  SET status = 'closed', evidence_paths = '[]'::jsonb, updated_at = now()
  WHERE id = p_report_id;
END;
$$;

REVOKE ALL ON FUNCTION public.close_bridgex_incident_report(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_bridgex_incident_report(uuid) TO authenticated;
