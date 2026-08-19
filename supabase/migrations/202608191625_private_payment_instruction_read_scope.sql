DROP POLICY IF EXISTS payment_instructions_authenticated_read ON storage.objects;
CREATE POLICY payment_instructions_payment_payer_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-instructions'
    AND EXISTS (
      SELECT 1
      FROM public.bridgex_payment_proofs AS proof
      WHERE proof.payer_id = auth.uid()
        AND proof.status IN ('pending_payment', 'payment_verifying', 'verified', 'rejected')
    )
  );
