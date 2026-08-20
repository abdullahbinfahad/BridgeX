ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_preferred_currency_check;
ALTER TABLE public.send_requests DROP CONSTRAINT IF EXISTS send_requests_currency_check;
ALTER TABLE public.carry_listings DROP CONSTRAINT IF EXISTS carry_listings_currency_check;
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_currency_check;
ALTER TABLE public.listing_interests DROP CONSTRAINT IF EXISTS listing_interests_currency_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_check;

ALTER TABLE public.users ADD CONSTRAINT users_preferred_currency_check CHECK (preferred_currency IN ('BDT', 'CNY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MYR', 'THB', 'IDR', 'KRW', 'PKR', 'NPR', 'LKR', 'TRY', 'ZAR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ILS', 'EGP', 'NGN', 'KES', 'GHS', 'VND', 'PHP', 'TWD', 'UAH', 'ARS', 'CLP', 'COP'));
ALTER TABLE public.send_requests ADD CONSTRAINT send_requests_currency_check CHECK (currency IN ('BDT', 'CNY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MYR', 'THB', 'IDR', 'KRW', 'PKR', 'NPR', 'LKR', 'TRY', 'ZAR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ILS', 'EGP', 'NGN', 'KES', 'GHS', 'VND', 'PHP', 'TWD', 'UAH', 'ARS', 'CLP', 'COP'));
ALTER TABLE public.carry_listings ADD CONSTRAINT carry_listings_currency_check CHECK (currency IN ('BDT', 'CNY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MYR', 'THB', 'IDR', 'KRW', 'PKR', 'NPR', 'LKR', 'TRY', 'ZAR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ILS', 'EGP', 'NGN', 'KES', 'GHS', 'VND', 'PHP', 'TWD', 'UAH', 'ARS', 'CLP', 'COP'));
ALTER TABLE public.offers ADD CONSTRAINT offers_currency_check CHECK (currency IN ('BDT', 'CNY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MYR', 'THB', 'IDR', 'KRW', 'PKR', 'NPR', 'LKR', 'TRY', 'ZAR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ILS', 'EGP', 'NGN', 'KES', 'GHS', 'VND', 'PHP', 'TWD', 'UAH', 'ARS', 'CLP', 'COP'));
ALTER TABLE public.listing_interests ADD CONSTRAINT listing_interests_currency_check CHECK (currency IN ('BDT', 'CNY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MYR', 'THB', 'IDR', 'KRW', 'PKR', 'NPR', 'LKR', 'TRY', 'ZAR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ILS', 'EGP', 'NGN', 'KES', 'GHS', 'VND', 'PHP', 'TWD', 'UAH', 'ARS', 'CLP', 'COP'));
ALTER TABLE public.orders ADD CONSTRAINT orders_currency_check CHECK (currency IN ('BDT', 'CNY', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'MYR', 'THB', 'IDR', 'KRW', 'PKR', 'NPR', 'LKR', 'TRY', 'ZAR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ILS', 'EGP', 'NGN', 'KES', 'GHS', 'VND', 'PHP', 'TWD', 'UAH', 'ARS', 'CLP', 'COP'));

CREATE OR REPLACE FUNCTION public.confirm_bridgex_traveler_payout_received(p_payout_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payout public.bridgex_traveler_payouts%ROWTYPE;
  v_sender_id uuid;
BEGIN
  SELECT * INTO v_payout FROM public.bridgex_traveler_payouts WHERE id = p_payout_id FOR UPDATE;
  IF v_payout.id IS NULL OR v_payout.traveler_id <> auth.uid() THEN RAISE EXCEPTION 'Only the matched traveler can confirm this payout.'; END IF;
  IF v_payout.payout_status <> 'payment_sent' THEN RAISE EXCEPTION 'This payout has not been marked sent yet.'; END IF;
  SELECT sender_id INTO v_sender_id FROM public.orders WHERE id = v_payout.order_id;
  UPDATE public.bridgex_traveler_payouts SET payout_status = 'received', received_at = now(), updated_at = now() WHERE id = v_payout.id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT id, auth.uid(), 'traveler_payout_received', 'Traveler confirmed payout receipt', 'The traveler confirmed receiving the completed-order payout.', '/admin/payouts', v_payout.id
  FROM public.users
  WHERE role IN ('admin', 'super_admin')
    AND coalesce(suspended, false) = false
    AND id IS DISTINCT FROM v_sender_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_bridgex_traveler_payout_received(uuid) TO authenticated;
