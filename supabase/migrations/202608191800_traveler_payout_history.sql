CREATE TABLE IF NOT EXISTS public.bridgex_traveler_payout_profiles (
  traveler_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  payout_method text NOT NULL CHECK (payout_method IN ('alipay', 'wechat_pay', 'bank_transfer')),
  account_holder text NOT NULL,
  account_reference text,
  qr_path text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bridgex_traveler_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.users(id),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  payout_status text NOT NULL DEFAULT 'details_required' CHECK (payout_status IN ('details_required', 'payment_due', 'payment_sent', 'received')),
  payout_method text CHECK (payout_method IN ('alipay', 'wechat_pay', 'bank_transfer')),
  account_holder text,
  account_reference text,
  qr_path text,
  payment_reference text,
  administrator_note text,
  paid_by uuid REFERENCES public.users(id),
  paid_at timestamptz,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bridgex_traveler_payouts_traveler_status_idx ON public.bridgex_traveler_payouts (traveler_id, payout_status, created_at DESC);
CREATE INDEX IF NOT EXISTS bridgex_traveler_payouts_status_idx ON public.bridgex_traveler_payouts (payout_status, created_at DESC);

ALTER TABLE public.send_requests DROP CONSTRAINT IF EXISTS send_requests_status_check;
ALTER TABLE public.send_requests ADD CONSTRAINT send_requests_status_check
  CHECK (status IN ('open', 'payment_pending', 'matched', 'released', 'closed'));

ALTER TABLE public.bridgex_traveler_payout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridgex_traveler_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY traveler_payout_profile_owner_or_admin_read ON public.bridgex_traveler_payout_profiles FOR SELECT TO authenticated USING (traveler_id = auth.uid() OR public.is_bridgex_admin());
CREATE POLICY traveler_payout_profile_owner_write ON public.bridgex_traveler_payout_profiles FOR INSERT TO authenticated WITH CHECK (traveler_id = auth.uid());
CREATE POLICY traveler_payout_profile_owner_update ON public.bridgex_traveler_payout_profiles FOR UPDATE TO authenticated USING (traveler_id = auth.uid()) WITH CHECK (traveler_id = auth.uid());
CREATE POLICY traveler_payout_owner_or_admin_read ON public.bridgex_traveler_payouts FOR SELECT TO authenticated USING (traveler_id = auth.uid() OR public.is_bridgex_admin());
CREATE POLICY traveler_payout_admin_update ON public.bridgex_traveler_payouts FOR UPDATE TO authenticated USING (public.is_bridgex_admin()) WITH CHECK (public.is_bridgex_admin());

INSERT INTO storage.buckets (id, name, public) VALUES ('traveler-payout-instructions', 'traveler-payout-instructions', false) ON CONFLICT (id) DO UPDATE SET public = false;
CREATE POLICY traveler_payout_instruction_upload_own ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'traveler-payout-instructions' AND name LIKE auth.uid()::text || '/%');
CREATE POLICY traveler_payout_instruction_read_owner_or_admin ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'traveler-payout-instructions' AND (name LIKE auth.uid()::text || '/%' OR public.is_bridgex_admin()));

CREATE OR REPLACE FUNCTION public.save_bridgex_traveler_payout_profile(p_method text, p_account_holder text, p_account_reference text DEFAULT NULL, p_qr_path text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_method NOT IN ('alipay', 'wechat_pay', 'bank_transfer') THEN RAISE EXCEPTION 'Choose Alipay, WeChat Pay, or bank transfer.'; END IF;
  IF coalesce(trim(p_account_holder), '') = '' THEN RAISE EXCEPTION 'Add the account holder name for payout.'; END IF;
  IF p_method = 'bank_transfer' AND coalesce(trim(p_account_reference), '') = '' THEN RAISE EXCEPTION 'Add bank account or routing details for bank transfer.'; END IF;
  IF p_qr_path IS NOT NULL AND p_qr_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Upload payout instructions to your own protected folder first.'; END IF;
  INSERT INTO public.bridgex_traveler_payout_profiles (traveler_id, payout_method, account_holder, account_reference, qr_path, updated_at)
  VALUES (auth.uid(), p_method, trim(p_account_holder), nullif(trim(p_account_reference), ''), p_qr_path, now())
  ON CONFLICT (traveler_id) DO UPDATE SET payout_method = EXCLUDED.payout_method, account_holder = EXCLUDED.account_holder, account_reference = EXCLUDED.account_reference, qr_path = EXCLUDED.qr_path, updated_at = now();
  UPDATE public.bridgex_traveler_payouts
  SET payout_status = 'payment_due', payout_method = p_method, account_holder = trim(p_account_holder), account_reference = nullif(trim(p_account_reference), ''), qr_path = p_qr_path, updated_at = now()
  WHERE traveler_id = auth.uid() AND payout_status = 'details_required';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_bridgex_traveler_order(p_order_id uuid, p_fulfillment_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.traveler_id <> auth.uid() THEN RAISE EXCEPTION 'Only the matched traveler can update this order.'; END IF;
  IF p_fulfillment_status NOT IN ('china_pickup','received','in_transit','delivered') THEN RAISE EXCEPTION 'Unsupported traveler update.'; END IF;
  IF p_fulfillment_status = 'delivered' AND NOT EXISTS (SELECT 1 FROM public.bridgex_traveler_payout_profiles WHERE traveler_id = auth.uid()) THEN RAISE EXCEPTION 'Add your private payout QR or bank details in Payment history before marking this order delivered.'; END IF;
  UPDATE public.orders SET fulfillment_status = p_fulfillment_status, last_traveler_update_at = now(), last_reminder_at = NULL, reminder_days = 0, updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) VALUES (v_order.sender_id, auth.uid(), 'traveler_order_update', 'Traveler updated your order', concat('Order ', v_order.reference, ' is now ', replace(p_fulfillment_status, '_', ' '), '.'), '/dashboard/orders', p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_bridgex_sender_delivery(p_order_id uuid)
RETURNS TABLE(order_id uuid, match_id uuid, post_kind text, post_id uuid, removed_media_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE v_order public.orders%ROWTYPE; v_match public.matches%ROWTYPE; v_profile public.bridgex_traveler_payout_profiles%ROWTYPE; v_paths jsonb := '[]'::jsonb; v_path text; v_count integer := 0; v_payout_status text;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Protected order was not found.'; END IF;
  IF v_order.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Only the sender can confirm receipt and release this order.'; END IF;
  IF v_order.fulfillment_status <> 'delivered' THEN RAISE EXCEPTION 'The traveler must mark this order delivered before the sender can confirm receipt.'; END IF;
  IF v_order.escrow_status = 'released' THEN RAISE EXCEPTION 'This protected order has already been released.'; END IF;
  SELECT * INTO v_match FROM public.matches WHERE id = v_order.match_id FOR UPDATE;
  IF v_match.id IS NULL THEN RAISE EXCEPTION 'The protected match for this order was not found.'; END IF;
  SELECT * INTO v_profile FROM public.bridgex_traveler_payout_profiles WHERE traveler_id = v_order.traveler_id;
  IF v_match.request_id IS NOT NULL THEN SELECT coalesce(media_paths, '[]'::jsonb) || CASE WHEN image_path IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(image_path) END INTO v_paths FROM public.send_requests WHERE id = v_match.request_id FOR UPDATE; UPDATE public.send_requests SET status = 'released', image_path = NULL, media_paths = '[]'::jsonb WHERE id = v_match.request_id;
  ELSIF v_match.listing_id IS NOT NULL THEN SELECT coalesce(media_paths, '[]'::jsonb) INTO v_paths FROM public.carry_listings WHERE id = v_match.listing_id FOR UPDATE; UPDATE public.carry_listings SET status = 'released', media_paths = '[]'::jsonb WHERE id = v_match.listing_id; END IF;
  FOR v_path IN SELECT DISTINCT value FROM jsonb_array_elements_text(coalesce(v_paths, '[]'::jsonb)) LOOP DELETE FROM storage.objects WHERE bucket_id = 'request-media' AND name = v_path; IF FOUND THEN v_count := v_count + 1; END IF; END LOOP;
  UPDATE public.orders SET escrow_status = 'released', fulfillment_status = 'completed', updated_at = now() WHERE id = p_order_id;
  UPDATE public.matches SET status = 'completed' WHERE id = v_match.id;
  v_payout_status := CASE WHEN v_profile.traveler_id IS NULL THEN 'details_required' ELSE 'payment_due' END;
  INSERT INTO public.bridgex_traveler_payouts (order_id, traveler_id, amount, currency, payout_status, payout_method, account_holder, account_reference, qr_path)
  VALUES (v_order.id, v_order.traveler_id, v_order.amount_bdt, coalesce(v_order.currency, 'BDT'), v_payout_status, v_profile.payout_method, v_profile.account_holder, v_profile.account_reference, v_profile.qr_path);
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (v_order.sender_id, auth.uid(), 'sender_received_release', 'Order completed and released', concat('Order ', v_order.reference, ' was marked received. Its post media was removed and its history is retained in Completed orders.'), '/dashboard/completed', p_order_id),
    (v_order.traveler_id, auth.uid(), CASE WHEN v_payout_status = 'payment_due' THEN 'traveler_payout_due' ELSE 'traveler_payout_details_required' END, CASE WHEN v_payout_status = 'payment_due' THEN 'Traveler payment is due' ELSE 'Add payout details to receive payment' END, CASE WHEN v_payout_status = 'payment_due' THEN concat('Order ', v_order.reference, ' was released. Your payout is now due for administrator review.') ELSE concat('Order ', v_order.reference, ' was released. Add a private QR image or bank details in Payment history so payment can be processed.') END, '/dashboard/payments', p_order_id);
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT id, auth.uid(), CASE WHEN v_payout_status = 'payment_due' THEN 'traveler_payout_due' ELSE 'traveler_payout_details_required' END, CASE WHEN v_payout_status = 'payment_due' THEN 'Traveler payment due' ELSE 'Traveler payout details required' END, CASE WHEN v_payout_status = 'payment_due' THEN concat('Order ', v_order.reference, ' was released. Review the traveler payout instructions and process the due payment.') ELSE concat('Order ', v_order.reference, ' was released, but the traveler must add private payout instructions before payment can be processed.') END, '/admin/payouts', p_order_id FROM public.users WHERE role IN ('admin', 'super_admin') AND coalesce(suspended, false) = false;
  RETURN QUERY SELECT v_order.id, v_match.id, CASE WHEN v_match.request_id IS NOT NULL THEN 'request' ELSE 'listing' END, coalesce(v_match.request_id, v_match.listing_id), v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_bridgex_traveler_payout_sent(p_payout_id uuid, p_payment_reference text DEFAULT NULL, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_payout public.bridgex_traveler_payouts%ROWTYPE;
BEGIN
  IF NOT public.is_bridgex_admin() THEN RAISE EXCEPTION 'Only an administrator can record a traveler payout.'; END IF;
  SELECT * INTO v_payout FROM public.bridgex_traveler_payouts WHERE id = p_payout_id FOR UPDATE;
  IF v_payout.id IS NULL OR v_payout.payout_status <> 'payment_due' THEN RAISE EXCEPTION 'This traveler payout is not ready to be marked sent.'; END IF;
  UPDATE public.bridgex_traveler_payouts SET payout_status = 'payment_sent', payment_reference = nullif(trim(p_payment_reference), ''), administrator_note = nullif(trim(p_note), ''), paid_by = auth.uid(), paid_at = now(), updated_at = now() WHERE id = v_payout.id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) VALUES (v_payout.traveler_id, auth.uid(), 'traveler_payout_sent', 'Traveler payment sent', 'An administrator recorded your completed-order payout as sent. Confirm receipt in Payment history after checking your payment account.', '/dashboard/payments', v_payout.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_bridgex_traveler_payout_received(p_payout_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_payout public.bridgex_traveler_payouts%ROWTYPE;
BEGIN
  SELECT * INTO v_payout FROM public.bridgex_traveler_payouts WHERE id = p_payout_id FOR UPDATE;
  IF v_payout.id IS NULL OR v_payout.traveler_id <> auth.uid() THEN RAISE EXCEPTION 'Only the matched traveler can confirm this payout.'; END IF;
  IF v_payout.payout_status <> 'payment_sent' THEN RAISE EXCEPTION 'This payout has not been marked sent yet.'; END IF;
  UPDATE public.bridgex_traveler_payouts SET payout_status = 'received', received_at = now(), updated_at = now() WHERE id = v_payout.id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) SELECT id, auth.uid(), 'traveler_payout_received', 'Traveler confirmed payout receipt', 'The traveler confirmed receiving the completed-order payout.', '/admin/payouts', v_payout.id FROM public.users WHERE role IN ('admin', 'super_admin') AND coalesce(suspended, false) = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_bridgex_traveler_payout_profile(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_bridgex_traveler_payout_sent(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_bridgex_traveler_payout_received(uuid) TO authenticated;
