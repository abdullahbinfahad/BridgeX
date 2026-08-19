INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-instructions', 'payment-instructions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS payment_instructions_authenticated_read ON storage.objects;
CREATE POLICY payment_instructions_authenticated_read
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-instructions');
