ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);
ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS reply_body text CHECK (reply_body IS NULL OR char_length(trim(reply_body)) BETWEEN 1 AND 4000);
ALTER TABLE public.contact_enquiries ADD COLUMN IF NOT EXISTS replied_at timestamptz;
CREATE INDEX IF NOT EXISTS contact_enquiries_user_created_idx ON public.contact_enquiries(user_id, created_at DESC);
CREATE POLICY contact_enquiries_member_read_own ON public.contact_enquiries FOR SELECT TO authenticated USING (user_id = auth.uid());
