-- Administrator-managed currency conversion for payment instructions.
-- `rate` is quote-currency units per one base-currency unit.

CREATE TABLE IF NOT EXISTS public.bridgex_exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL CHECK (base_currency ~ '^[A-Z]{3}$'),
  quote_currency text NOT NULL CHECK (quote_currency ~ '^[A-Z]{3}$'),
  rate numeric(20,8) NOT NULL CHECK (rate > 0),
  updated_by uuid NOT NULL REFERENCES public.users(id),
  effective_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency),
  CHECK (base_currency <> quote_currency)
);

CREATE INDEX IF NOT EXISTS bridgex_exchange_rates_pair_idx
  ON public.bridgex_exchange_rates (base_currency, quote_currency);

ALTER TABLE public.bridgex_exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bridgex_exchange_rates_authenticated_read ON public.bridgex_exchange_rates;
CREATE POLICY bridgex_exchange_rates_authenticated_read
  ON public.bridgex_exchange_rates FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.bridgex_payment_proofs
  ADD COLUMN IF NOT EXISTS settlement_currency text,
  ADD COLUMN IF NOT EXISTS settlement_amount numeric,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric,
  ADD COLUMN IF NOT EXISTS exchange_rate_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.bridgex_snapshot_payment_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric;
  v_effective_at timestamptz;
BEGIN
  new.currency := upper(coalesce(new.currency, 'BDT'));
  new.settlement_currency := 'CNY';

  IF new.currency = 'CNY' THEN
    new.exchange_rate := 1;
    new.settlement_amount := round(new.amount, 2);
    new.exchange_rate_updated_at := now();
    RETURN new;
  END IF;

  SELECT rate, effective_at
  INTO v_rate, v_effective_at
  FROM public.bridgex_exchange_rates
  WHERE base_currency = new.currency AND quote_currency = 'CNY';

  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'BridgeX has not published the current % to CNY payment rate. Ask an administrator to update the rate before starting payment.', new.currency;
  END IF;

  new.exchange_rate := v_rate;
  new.settlement_amount := round(new.amount * v_rate, 2);
  new.exchange_rate_updated_at := v_effective_at;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS bridgex_payment_conversion_snapshot ON public.bridgex_payment_proofs;
CREATE TRIGGER bridgex_payment_conversion_snapshot
  BEFORE INSERT OR UPDATE OF amount, currency ON public.bridgex_payment_proofs
  FOR EACH ROW EXECUTE FUNCTION public.bridgex_snapshot_payment_conversion();

CREATE OR REPLACE FUNCTION public.save_bridgex_exchange_rate(
  p_base_currency text,
  p_quote_currency text,
  p_rate numeric,
  p_effective_at timestamptz DEFAULT now()
)
RETURNS public.bridgex_exchange_rates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate public.bridgex_exchange_rates;
  v_base text := upper(trim(coalesce(p_base_currency, '')));
  v_quote text := upper(trim(coalesce(p_quote_currency, '')));
BEGIN
  IF NOT public.is_bridgex_admin() THEN
    RAISE EXCEPTION 'Only an administrator can publish BridgeX payment exchange rates.';
  END IF;
  IF v_base !~ '^[A-Z]{3}$' OR v_quote !~ '^[A-Z]{3}$' OR v_base = v_quote THEN
    RAISE EXCEPTION 'Choose two different three-letter currency codes.';
  END IF;
  IF p_rate IS NULL OR p_rate <= 0 THEN
    RAISE EXCEPTION 'Enter a positive exchange rate.';
  END IF;

  INSERT INTO public.bridgex_exchange_rates (base_currency, quote_currency, rate, updated_by, effective_at, updated_at)
  VALUES (v_base, v_quote, p_rate, auth.uid(), coalesce(p_effective_at, now()), now())
  ON CONFLICT (base_currency, quote_currency)
  DO UPDATE SET rate = EXCLUDED.rate, updated_by = EXCLUDED.updated_by, effective_at = EXCLUDED.effective_at, updated_at = now()
  RETURNING * INTO v_rate;
  RETURN v_rate;
END;
$$;

REVOKE ALL ON FUNCTION public.save_bridgex_exchange_rate(text, text, numeric, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_bridgex_exchange_rate(text, text, numeric, timestamptz) TO authenticated;
