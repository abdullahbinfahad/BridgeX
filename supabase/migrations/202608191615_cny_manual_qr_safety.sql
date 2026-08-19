CREATE OR REPLACE FUNCTION public.enforce_bridgex_manual_qr_cny()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF new.currency <> 'CNY' THEN
    RAISE EXCEPTION 'Manual Alipay and WeChat Pay QR payments are available only for CNY transactions. Select CNY before starting payment.';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS bridgex_manual_qr_cny_only ON public.bridgex_payment_proofs;
CREATE TRIGGER bridgex_manual_qr_cny_only
  BEFORE INSERT OR UPDATE OF currency ON public.bridgex_payment_proofs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_manual_qr_cny();
