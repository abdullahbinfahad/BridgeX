CREATE OR REPLACE FUNCTION public.confirm_bridgex_sender_delivery(p_order_id uuid)
RETURNS TABLE(order_id uuid, match_id uuid, post_kind text, post_id uuid, removed_media_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_paths jsonb := '[]'::jsonb;
  v_path text;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Protected order was not found.'; END IF;
  IF v_order.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Only the sender can confirm receipt and release this order.'; END IF;
  IF v_order.fulfillment_status <> 'delivered' THEN RAISE EXCEPTION 'The traveler must mark this order delivered before the sender can confirm receipt.'; END IF;
  IF v_order.escrow_status = 'released' THEN RAISE EXCEPTION 'This protected order has already been released.'; END IF;

  SELECT * INTO v_match FROM public.matches WHERE id = v_order.match_id FOR UPDATE;
  IF v_match.id IS NULL THEN RAISE EXCEPTION 'The protected match for this order was not found.'; END IF;

  IF v_match.request_id IS NOT NULL THEN
    SELECT coalesce(media_paths, '[]'::jsonb) || CASE WHEN image_path IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(image_path) END
      INTO v_paths FROM public.send_requests WHERE id = v_match.request_id FOR UPDATE;
    UPDATE public.send_requests SET status = 'released', image_path = NULL, media_paths = '[]'::jsonb WHERE id = v_match.request_id;
  ELSIF v_match.listing_id IS NOT NULL THEN
    SELECT coalesce(media_paths, '[]'::jsonb) INTO v_paths FROM public.carry_listings WHERE id = v_match.listing_id FOR UPDATE;
    UPDATE public.carry_listings SET status = 'released', media_paths = '[]'::jsonb WHERE id = v_match.listing_id;
  END IF;

  FOR v_path IN SELECT DISTINCT value FROM jsonb_array_elements_text(coalesce(v_paths, '[]'::jsonb)) LOOP
    DELETE FROM storage.objects WHERE bucket_id = 'request-media' AND name = v_path;
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;

  UPDATE public.orders SET escrow_status = 'released', fulfillment_status = 'completed', updated_at = now() WHERE id = p_order_id;
  UPDATE public.matches SET status = 'completed' WHERE id = v_match.id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES
    (v_order.sender_id, auth.uid(), 'sender_received_release', 'Order completed and released', concat('Order ', v_order.reference, ' was marked received. Its post media was removed and its history is retained in Completed orders.'), '/dashboard/completed', p_order_id),
    (v_order.traveler_id, auth.uid(), 'sender_received_release', 'Sender confirmed receipt', concat('Order ', v_order.reference, ' was released after the sender confirmed delivery.'), '/dashboard/completed', p_order_id);
  RETURN QUERY SELECT v_order.id, v_match.id, CASE WHEN v_match.request_id IS NOT NULL THEN 'request' ELSE 'listing' END, coalesce(v_match.request_id, v_match.listing_id), v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_bridgex_sender_delivery(uuid) TO authenticated;
