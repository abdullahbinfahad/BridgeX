CREATE OR REPLACE FUNCTION public.bridgex_apply_confirmed_interest_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.carry_listings%ROWTYPE;
  v_remaining jsonb;
  v_item text;
  v_quantity numeric;
BEGIN
  IF NEW.status <> 'accepted' OR OLD.status = 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_listing FROM public.carry_listings WHERE id = NEW.listing_id FOR UPDATE;
  IF v_listing.id IS NULL THEN
    RETURN NEW;
  END IF;

  v_remaining := coalesce(v_listing.accepted_item_quantities, '{}'::jsonb);
  FOR v_item, v_quantity IN SELECT key, value::numeric FROM jsonb_each_text(coalesce(NEW.item_quantities, '{}'::jsonb)) LOOP
    IF coalesce((v_remaining ->> v_item)::numeric, 0) > 0 THEN
      v_remaining := jsonb_set(v_remaining, ARRAY[v_item], to_jsonb(greatest(0, coalesce((v_remaining ->> v_item)::numeric, 0) - greatest(v_quantity, 0))), true);
    END IF;
  END LOOP;

  UPDATE public.carry_listings
  SET accepted_item_quantities = v_remaining
  WHERE id = v_listing.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bridgex_confirmed_interest_inventory ON public.listing_interests;
CREATE TRIGGER bridgex_confirmed_interest_inventory
AFTER UPDATE OF status ON public.listing_interests
FOR EACH ROW EXECUTE FUNCTION public.bridgex_apply_confirmed_interest_inventory();

CREATE OR REPLACE FUNCTION public.bridgex_normalize_carry_listing_visibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_remaining_weight numeric;
  v_has_remaining_items boolean;
BEGIN
  IF NEW.status = 'paused' THEN
    RETURN NEW;
  END IF;

  v_remaining_weight := greatest(0, coalesce(NEW.available_weight_kg, 0) - coalesce(NEW.filled_weight_kg, 0) - coalesce(NEW.reserved_weight_kg, 0));
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_each_text(coalesce(NEW.accepted_item_quantities, '{}'::jsonb)) AS inventory(item, quantity)
    WHERE coalesce(quantity::numeric, 0) > 0
  ) INTO v_has_remaining_items;

  IF v_remaining_weight > 0 OR v_has_remaining_items THEN
    IF NEW.status IN ('closed', 'released') THEN
      NEW.status := 'open';
    END IF;
  ELSIF NEW.status = 'open' THEN
    NEW.status := 'closed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bridgex_carry_listing_visibility ON public.carry_listings;
CREATE TRIGGER bridgex_carry_listing_visibility
BEFORE UPDATE OF status, available_weight_kg, filled_weight_kg, reserved_weight_kg, accepted_item_quantities ON public.carry_listings
FOR EACH ROW EXECUTE FUNCTION public.bridgex_normalize_carry_listing_visibility();

CREATE OR REPLACE FUNCTION public.confirm_bridgex_sender_delivery(p_order_id uuid)
RETURNS TABLE(order_id uuid, match_id uuid, post_kind text, post_id uuid, removed_media_count integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_profile public.bridgex_traveler_payout_profiles%ROWTYPE;
  v_paths jsonb := '[]'::jsonb;
  v_path text;
  v_count integer := 0;
  v_payout_status text;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Protected order was not found.'; END IF;
  IF v_order.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Only the sender can confirm receipt and release this order.'; END IF;
  IF v_order.fulfillment_status <> 'delivered' THEN RAISE EXCEPTION 'The traveler must mark this order delivered before the sender can confirm receipt.'; END IF;
  IF v_order.escrow_status = 'released' THEN RAISE EXCEPTION 'This protected order has already been released.'; END IF;

  SELECT * INTO v_match FROM public.matches WHERE id = v_order.match_id FOR UPDATE;
  IF v_match.id IS NULL THEN RAISE EXCEPTION 'The protected match for this order was not found.'; END IF;
  SELECT * INTO v_profile FROM public.bridgex_traveler_payout_profiles WHERE traveler_id = v_order.traveler_id;

  IF v_match.request_id IS NOT NULL THEN
    SELECT coalesce(media_paths, '[]'::jsonb) || CASE WHEN image_path IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(image_path) END INTO v_paths FROM public.send_requests WHERE id = v_match.request_id FOR UPDATE;
    UPDATE public.send_requests SET status = 'released', image_path = NULL, media_paths = '[]'::jsonb WHERE id = v_match.request_id;
  ELSIF v_match.listing_id IS NOT NULL THEN
    -- A carry listing may serve multiple accepted interests. Keep its images and listing visible until the traveler hides, deletes, or exhausts it.
    PERFORM 1 FROM public.carry_listings WHERE id = v_match.listing_id FOR UPDATE;
  END IF;

  FOR v_path IN SELECT DISTINCT value FROM jsonb_array_elements_text(coalesce(v_paths, '[]'::jsonb)) LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'request-media' AND name = v_path;
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;

  UPDATE public.orders SET escrow_status = 'released', fulfillment_status = 'completed', updated_at = now() WHERE id = v_order.id;
  UPDATE public.matches SET status = 'completed' WHERE id = v_match.id;
  v_payout_status := CASE WHEN v_profile.traveler_id IS NULL THEN 'details_required' ELSE 'payment_due' END;
  INSERT INTO public.bridgex_traveler_payouts (order_id, traveler_id, amount, currency, payout_status, payout_method, account_holder, account_reference, qr_path)
  VALUES (v_order.id, v_order.traveler_id, v_order.amount_bdt, coalesce(v_order.currency, 'BDT'), v_payout_status, v_profile.payout_method, v_profile.account_holder, v_profile.account_reference, v_profile.qr_path);

  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES
    (v_order.sender_id, auth.uid(), 'sender_received_release', 'Order completed and released', concat('Order ', v_order.reference, ' was marked received. Its completed-order history is retained.'), '/dashboard/completed', v_order.id),
    (v_order.traveler_id, auth.uid(), CASE WHEN v_payout_status = 'payment_due' THEN 'traveler_payout_due' ELSE 'traveler_payout_details_required' END, CASE WHEN v_payout_status = 'payment_due' THEN 'Traveler payment is due' ELSE 'Add payout details to receive payment' END, CASE WHEN v_payout_status = 'payment_due' THEN concat('Order ', v_order.reference, ' was released. Your payout is now due for administrator review.') ELSE concat('Order ', v_order.reference, ' was released. Add a private QR image or bank details so payment can be processed.') END, '/dashboard/payouts', v_order.id);
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT id, auth.uid(), CASE WHEN v_payout_status = 'payment_due' THEN 'traveler_payout_due' ELSE 'traveler_payout_details_required' END, CASE WHEN v_payout_status = 'payment_due' THEN 'Traveler payment due' ELSE 'Traveler payout details required' END, CASE WHEN v_payout_status = 'payment_due' THEN concat('Order ', v_order.reference, ' was released. Review the traveler payout instructions and process the due payment.') ELSE concat('Order ', v_order.reference, ' was released, but the traveler must add private payout instructions before payment can be processed.') END, '/admin/payouts', v_order.id FROM public.users WHERE role IN ('admin', 'super_admin') AND coalesce(suspended, false) = false;
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
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) VALUES (v_payout.traveler_id, auth.uid(), 'traveler_payout_sent', 'Traveler payment sent', 'An administrator recorded your completed-order payout as sent. Confirm receipt in Traveler payouts after checking your payment account.', '/dashboard/payouts', v_payout.id);
END;
$$;
