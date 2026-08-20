DROP POLICY IF EXISTS reports_admin_delete ON public.incident_reports;
CREATE POLICY reports_admin_delete
ON public.incident_reports
FOR DELETE TO authenticated
USING (public.is_bridgex_admin());
