BEGIN;

ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS declared_item_value numeric;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS item_purpose text;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS declared_commercial_use boolean;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS declaration_confirmed_at timestamptz;

ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS declared_item_value numeric;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS item_purpose text;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS declared_commercial_use boolean;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS declaration_confirmed_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_bridgex_item_declaration()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.declared_item_value IS NULL OR NEW.declared_item_value < 0
     OR coalesce(trim(NEW.item_purpose), '') = ''
     OR NEW.declared_commercial_use IS NULL
     OR NEW.declaration_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Provide the declared item value, purpose, commercial-use status, and truthful-item confirmation before completing this action.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_send_request_item_declaration ON public.send_requests;
CREATE TRIGGER enforce_send_request_item_declaration
BEFORE INSERT ON public.send_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_item_declaration();

DROP TRIGGER IF EXISTS enforce_listing_interest_item_declaration ON public.listing_interests;
CREATE TRIGGER enforce_listing_interest_item_declaration
BEFORE INSERT OR UPDATE ON public.listing_interests
FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_item_declaration();

CREATE TABLE IF NOT EXISTS public.bridgex_handoff_refusals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('undeclared_item', 'material_mismatch', 'prohibited_or_restricted', 'unsafe_handoff', 'other')),
  details text NOT NULL CHECK (char_length(trim(details)) BETWEEN 5 AND 1200),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  admin_note text
);

CREATE INDEX IF NOT EXISTS bridgex_handoff_refusals_order_created_idx ON public.bridgex_handoff_refusals(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bridgex_handoff_refusals_status_created_idx ON public.bridgex_handoff_refusals(status, created_at DESC);

ALTER TABLE public.bridgex_handoff_refusals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bridgex_handoff_refusals_read_own_or_admin ON public.bridgex_handoff_refusals;
CREATE POLICY bridgex_handoff_refusals_read_own_or_admin ON public.bridgex_handoff_refusals
FOR SELECT TO authenticated USING (traveler_id = auth.uid() OR public.is_bridgex_admin());
DROP POLICY IF EXISTS bridgex_handoff_refusals_admin_update ON public.bridgex_handoff_refusals;
CREATE POLICY bridgex_handoff_refusals_admin_update ON public.bridgex_handoff_refusals
FOR UPDATE TO authenticated USING (public.is_bridgex_admin()) WITH CHECK (public.is_bridgex_admin());

CREATE OR REPLACE FUNCTION public.refuse_bridgex_handoff(p_order_id uuid, p_reason text, p_details text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_refusal_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.traveler_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the matched traveler can refuse a handoff.';
  END IF;
  IF v_order.fulfillment_status IN ('completed', 'cancelled') OR v_order.escrow_status IN ('released', 'refunded') THEN
    RAISE EXCEPTION 'This protected order can no longer be refused.';
  END IF;
  IF p_reason NOT IN ('undeclared_item', 'material_mismatch', 'prohibited_or_restricted', 'unsafe_handoff', 'other')
     OR char_length(trim(coalesce(p_details, ''))) NOT BETWEEN 5 AND 1200 THEN
    RAISE EXCEPTION 'Choose a refusal reason and provide a concise factual explanation.';
  END IF;
  INSERT INTO public.bridgex_handoff_refusals(order_id, traveler_id, reason, details)
  VALUES (v_order.id, auth.uid(), p_reason, trim(p_details)) RETURNING id INTO v_refusal_id;
  UPDATE public.orders
  SET fulfillment_status = 'disputed', escrow_status = 'disputed', updated_at = now()
  WHERE id = v_order.id;
  INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, related_id)
  VALUES (v_order.sender_id, auth.uid(), 'handoff_refused', 'Handoff paused for safety review', concat('Order ', v_order.reference, ' was paused because the traveler reported an item or handoff concern. Open the protected deal for the next steps.'), '/dashboard/orders', v_order.id);
  INSERT INTO public.notifications(user_id, actor_id, type, title, body, link, related_id)
  SELECT id, auth.uid(), 'handoff_refused_admin', 'Traveler handoff refusal needs review', concat('Order ', v_order.reference, ' was paused for: ', replace(p_reason, '_', ' '), '.'), '/admin/orders', v_order.id
  FROM public.users WHERE role IN ('admin', 'super_admin') AND suspended = false;
  RETURN v_refusal_id;
END;
$$;
REVOKE ALL ON FUNCTION public.refuse_bridgex_handoff(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refuse_bridgex_handoff(uuid, text, text) TO authenticated;

ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS enquiry_kind text NOT NULL DEFAULT 'support';
ALTER TABLE public.contact_enquiries DROP CONSTRAINT IF EXISTS contact_enquiries_enquiry_kind_check;
ALTER TABLE public.contact_enquiries ADD CONSTRAINT contact_enquiries_enquiry_kind_check CHECK (enquiry_kind IN ('support', 'privacy_request', 'moderation_appeal'));

COMMIT;
