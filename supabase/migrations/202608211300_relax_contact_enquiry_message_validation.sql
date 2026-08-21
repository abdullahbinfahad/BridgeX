ALTER TABLE public.contact_enquiries
  DROP CONSTRAINT IF EXISTS contact_enquiries_message_check;

ALTER TABLE public.contact_enquiries
  ADD CONSTRAINT contact_enquiries_message_check
  CHECK (char_length(btrim(message)) BETWEEN 3 AND 4000);
