ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fulfillment_status_check CHECK (fulfillment_status = ANY (ARRAY['pending_purchase'::text,'matched'::text,'china_pickup'::text,'received'::text,'purchased'::text,'in_transit'::text,'delivered'::text,'completed'::text,'cancelled'::text,'disputed'::text]));
