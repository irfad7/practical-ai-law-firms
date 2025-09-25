
-- Add email column to chat_analytics table
ALTER TABLE public.chat_analytics ADD COLUMN user_email TEXT;

-- Create index for better performance when querying by email
CREATE INDEX idx_chat_analytics_user_email ON public.chat_analytics(user_email);

-- Update the RLS policy to allow filtering by email
DROP POLICY IF EXISTS "Allow public select on chat_analytics" ON public.chat_analytics;
CREATE POLICY "Allow public select on chat_analytics" 
  ON public.chat_analytics 
  FOR SELECT 
  USING (true);
