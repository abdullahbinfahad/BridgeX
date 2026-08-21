BEGIN;

ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS service_scope text;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS declared_item_currency text;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS service_scope text;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS declared_item_currency text;

ALTER TABLE public.send_requests DROP CONSTRAINT IF EXISTS send_requests_service_scope_check;
ALTER TABLE public.send_requests ADD CONSTRAINT send_requests_service_scope_check CHECK (service_scope IN ('domestic', 'international'));
ALTER TABLE public.listing_interests DROP CONSTRAINT IF EXISTS listing_interests_service_scope_check;
ALTER TABLE public.listing_interests ADD CONSTRAINT listing_interests_service_scope_check CHECK (service_scope IN ('domestic', 'international'));
ALTER TABLE public.send_requests DROP CONSTRAINT IF EXISTS send_requests_declared_item_currency_check;
ALTER TABLE public.send_requests ADD CONSTRAINT send_requests_declared_item_currency_check CHECK (declared_item_currency IS NULL OR declared_item_currency ~ '^[A-Z]{3}$');
ALTER TABLE public.listing_interests DROP CONSTRAINT IF EXISTS listing_interests_declared_item_currency_check;
ALTER TABLE public.listing_interests ADD CONSTRAINT listing_interests_declared_item_currency_check CHECK (declared_item_currency IS NULL OR declared_item_currency ~ '^[A-Z]{3}$');

CREATE OR REPLACE FUNCTION public.enforce_bridgex_item_declaration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_expected_scope text;
BEGIN
  IF NEW.service_scope NOT IN ('domestic', 'international') THEN
    RAISE EXCEPTION 'Choose whether this is a domestic or international service before completing this action.';
  END IF;

  IF TG_TABLE_NAME = 'send_requests' THEN
    v_expected_scope := CASE WHEN lower(trim(coalesce(NEW.purchase_country, ''))) = lower(trim(coalesce(NEW.destination_country, ''))) THEN 'domestic' ELSE 'international' END;
  ELSIF TG_TABLE_NAME = 'listing_interests' THEN
    SELECT CASE WHEN lower(trim(coalesce(origin_country, ''))) = lower(trim(coalesce(destination_country, ''))) THEN 'domestic' ELSE 'international' END
      INTO v_expected_scope
      FROM public.carry_listings
      WHERE id = NEW.listing_id;
    IF v_expected_scope IS NULL THEN
      RAISE EXCEPTION 'The selected carry listing is unavailable for declaration review.';
    END IF;
  END IF;

  IF NEW.service_scope <> v_expected_scope THEN
    RAISE EXCEPTION 'The selected service type must match the origin and destination countries for this route.';
  END IF;

  IF NEW.service_scope = 'international' AND (
    NEW.declared_item_value IS NULL OR NEW.declared_item_value < 0
    OR NEW.declared_item_currency IS NULL OR NEW.declared_item_currency !~ '^[A-Z]{3}$'
    OR coalesce(trim(NEW.item_purpose), '') = ''
    OR NEW.declared_commercial_use IS NULL
    OR NEW.declaration_confirmed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Provide the declared item value, currency, purpose, commercial-use status, and truthful-item confirmation for this international service.';
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
