-- Create admin_requests table for pending sign-ups
CREATE TABLE public.admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can view all requests
CREATE POLICY "Admins can view all admin requests"
ON public.admin_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update admin requests"
ON public.admin_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete admin requests"
ON public.admin_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert a request (for their own sign-up)
CREATE POLICY "Users can create their own request"
ON public.admin_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own request status
CREATE POLICY "Users can view their own request"
ON public.admin_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Enable realtime for admin requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_requests;