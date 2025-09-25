
-- Create table for storing chat analytics
CREATE TABLE public.chat_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for knowledge base documents
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  file_size INTEGER
);

-- Create table for chatbot instructions
CREATE TABLE public.chatbot_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_text TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for popular questions tracking
CREATE TABLE public.popular_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  last_asked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT
);

-- Add RLS policies for all tables
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_questions ENABLE ROW LEVEL SECURITY;

-- Allow public access for chat analytics (for the chat interface)
CREATE POLICY "Allow public insert on chat_analytics" 
  ON public.chat_analytics 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select on chat_analytics" 
  ON public.chat_analytics 
  FOR SELECT 
  USING (true);

-- Allow public access for knowledge base reading
CREATE POLICY "Allow public select on knowledge_base" 
  ON public.knowledge_base 
  FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Allow public insert on knowledge_base" 
  ON public.knowledge_base 
  FOR INSERT 
  WITH CHECK (true);

-- Allow public access for chatbot instructions reading
CREATE POLICY "Allow public select on chatbot_instructions" 
  ON public.chatbot_instructions 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Allow public insert on chatbot_instructions" 
  ON public.chatbot_instructions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on chatbot_instructions" 
  ON public.chatbot_instructions 
  FOR UPDATE 
  USING (true);

-- Allow public access for popular questions
CREATE POLICY "Allow public all on popular_questions" 
  ON public.popular_questions 
  FOR ALL 
  USING (true);

-- Insert default chatbot instructions
INSERT INTO public.chatbot_instructions (instruction_text, priority) VALUES 
('You are Ava, an AI assistant trained on the AI-First Masterclass for lawyers. You help answer questions about AI implementation in law firms, automation, client intake processes, and legal technology.', 1),
('Never discuss pricing directly. If someone asks about pricing, politely redirect them to schedule a consultation call.', 2),
('Be helpful, professional, and specific to legal practice.', 3),
('Always stay focused on the masterclass content and legal AI topics.', 4);
