ALTER TABLE public.send_requests DROP CONSTRAINT IF EXISTS send_requests_status_check;
ALTER TABLE public.send_requests ADD CONSTRAINT send_requests_status_check
  CHECK (status IN ('open', 'payment_pending', 'matched', 'closed'));
