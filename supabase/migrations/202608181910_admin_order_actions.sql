CREATE OR REPLACE FUNCTION public.update_bridgex_admin_order(p_order_id uuid, p_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  IF NOT public.is_bridgex_admin() THEN RAISE EXCEPTION 'Only an administrator can update protected orders.'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Protected order not found.'; END IF;
  CASE p_action
    WHEN 'fund' THEN UPDATE public.orders SET escrow_status = 'funded', updated_at = now() WHERE id = p_order_id;
    WHEN 'hold' THEN UPDATE public.orders SET escrow_status = 'held', updated_at = now() WHERE id = p_order_id;
    WHEN 'transit' THEN UPDATE public.orders SET fulfillment_status = 'in_transit', updated_at = now() WHERE id = p_order_id;
    WHEN 'delivered' THEN UPDATE public.orders SET fulfillment_status = 'delivered', updated_at = now() WHERE id = p_order_id;
    WHEN 'release' THEN UPDATE public.orders SET escrow_status = 'released', fulfillment_status = 'completed', updated_at = now() WHERE id = p_order_id;
    WHEN 'dispute' THEN UPDATE public.orders SET escrow_status = 'disputed', fulfillment_status = 'disputed', updated_at = now() WHERE id = p_order_id;
    ELSE RAISE EXCEPTION 'Unsupported administrator order action.';
  END CASE;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (v_order.sender_id, auth.uid(), 'order_updated', 'Administrator order update', concat('An administrator updated protected order ', v_order.reference, '.'), '/dashboard/orders', p_order_id),
         (v_order.traveler_id, auth.uid(), 'order_updated', 'Administrator order update', concat('An administrator updated protected order ', v_order.reference, '.'), '/dashboard/orders', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_bridgex_admin_order(uuid, text) TO authenticated;
