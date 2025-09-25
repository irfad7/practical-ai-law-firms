-- Migration to update chatbot instructions and knowledge base for "Lead to Retainer" workshop
-- This migration replaces the existing instructions with new ones for the workshop

-- First, deactivate all existing instructions
UPDATE public.chatbot_instructions SET is_active = false;

-- Delete old instructions to start fresh
DELETE FROM public.chatbot_instructions;

-- Insert new chatbot instructions for Lead to Retainer workshop
INSERT INTO public.chatbot_instructions (instruction_text, priority, is_active) VALUES 
('You are Ava, an AI assistant trained on My Legal Academy''s ''Practical AI for Law Firms: Lead to Retainer'' workshop. You help lawyers understand and implement AI-powered intake systems, digital teammates, and automation to convert leads into signed clients faster and more efficiently.', 1, true),

('This workshop was presented by Irfad Imtiaz (Director of Technology) and Aliza Rizvi (Tech Solutions Manager) from My Legal Academy. The session covered AI-powered intake systems, digital teammates, and the 11-stage blueprint to convert leads into signed retainers faster.', 2, true),

('When answering questions: Reference specific examples from the workshop (like the John Miller demo), explain the 11-stage blueprint when discussing intake process, mention that systems work across practice areas (PI, immigration, estate planning, etc.), highlight that this works for small firms (most MLA clients are small firms), emphasize the 37-second response time as critical, reference the Harvard Business Review stat about 80% lead loss after 1 minute, explain how AI doesn''t replace human touch - it delivers it where it counts, mention integration capabilities (WhatsApp, Instagram, website, etc.), talk about the difference between voice AI and chatbot AI systems.', 3, true),

('Never discuss specific pricing, program costs, or membership fees. If someone asks about pricing, costs, program details, packages, how to join My Legal Academy, or implementation timelines, respond with: "For specific information about programs, pricing, and implementation, I''d recommend scheduling a strategy call with MLA''s team. They offered workshop attendees a free strategy call plus access to the Lawyers Club community and the complete intake blueprint."', 4, true),

('Do not provide legal advice or practice-specific legal guidance, make guarantees about results or ROI, discuss competitors or compare to other AI solutions, share information not covered in the workshop, or speculate about future features. Stay focused on content from the ''Lead to Retainer'' workshop, practical implementation of AI in law firm intake, the 11-stage blueprint and digital teammates concept, and real examples and case studies mentioned in the session.', 5, true);

-- Clear existing knowledge base entries
DELETE FROM public.knowledge_base WHERE status = 'active';

-- Insert new knowledge base entries for Lead to Retainer workshop
INSERT INTO public.knowledge_base (filename, file_type, content, status) VALUES 
('workshop-overview.txt', 'text', 'The ''Practical AI for Law Firms: Lead to Retainer'' workshop was a live training session focused on helping law firms automate their intake process using AI. Presented by My Legal Academy''s tech team, it covered the complete journey from initial lead contact to signed retainer, with live demonstrations of AI voice agents and chatbots.', 'active'),

('speed-problem.txt', 'text', 'Research from Harvard Business Review shows that if you wait just 1 minute to respond to a lead, you''ve already lost about 80% of them. This is confirmed by Clio''s industry report. In today''s legal market, the fastest firm wins - even if they''re not the best firm. This is why digital teammates that respond within 37 seconds are critical.', 'active'),

('digital-teammates.txt', 'text', 'Digital teammates are AI-powered systems that handle specific intake tasks: calling new leads, qualifying prospects, scheduling appointments, collecting documents, sending reminders, and preparing case summaries. They work 24/7 and ensure no lead is missed, even when human staff are busy or after hours.', 'active'),

('practice-areas.txt', 'text', 'The AI intake systems work across all practice areas. Examples demonstrated included: personal injury (auto accidents), estate planning (will generation), immigration (WhatsApp integration for international clients), and criminal defense. Each practice area uses customized qualification questions specific to their case types.', 'active'),

('11-stage-blueprint.txt', 'text', 'The 11-Stage Intake Blueprint: 1) Lead Capture (from ads, website, referrals), 2) Initial Contact (within 37 seconds via AI call or chatbot), 3) Lead Qualification (using custom questions per practice area), 4) Appointment Scheduling (offering 2 time slots immediately), 5) Appointment Confirmation (automated SMS/email sequences), 6) Document Collection (secure forms sent automatically), 7) Pre-Consultation Preparation (AI summarizes case for human intaker), 8) Human Consultation (attorney or intake specialist meets prepared), 9) Follow-up & Nurture (automated sequences for those not ready), 10) Retainer Preparation & Signing (AI-generated, mobile-friendly), 11) Case Management Integration (auto-creates files, notifies paralegal).', 'active'),

('my-legal-academy.txt', 'text', 'About My Legal Academy: #1 AI implementation company for law firms, helped over 1,400 law firms grow and scale, founded by Sam Olai who built 7 profitable law firms using AI and automation, generated 56,000+ clients online and collected 4,900+ 5-star reviews, members consistently generate 30,000+ legal leads monthly, private community of 1,700+ attorneys (Lawyers Club), YouTube channel with 24,000+ subscribers, partnered with Neil Tyra''s ''The Law Entrepreneur'' podcast (460+ episodes).', 'active'),

('ai-systems.txt', 'text', 'Two AI Systems Demonstrated: Voice AI (Joe) - Outbound calling system that calls new leads within 37 seconds, qualifies them with custom questions, schedules appointments on calendar, sends document collection links, works for any practice area. Chatbot AI - Website/messaging system that lives on websites, Instagram, WhatsApp, Facebook, qualifies leads through conversation, generates sample documents (like will previews), schedules consultations, works 24/7 for introverts who prefer async communication.', 'active'),

('success-stories.txt', 'text', 'Success Stories Mentioned: Demarcus: Started from scratch 2 years ago, now at $3M revenue with 630% ROI. Clint & Price: Two-person team, now at 1,352% ROI. Mark Lopez (criminal defense): 140% ROI in 6 months. Works across all practice areas: PI, immigration, estate planning, criminal defense.', 'active'),

('implementation.txt', 'text', 'MLA''s implementation philosophy is ''systems-first'' - they don''t just teach theory, they build working systems. All systems are tested first in Sam Olai''s 7 law firms, then with ambassador firms, before being deployed to members. This ensures everything is proven to work before implementation. Works with any CRM (Lawmatics, HubSpot, Salesforce, Legal Funnel). Requires API access (test by Googling ''[your tool] + Zapier''). Integrates with existing systems - doesn''t replace them. Can connect to WhatsApp, Instagram DMs, Facebook Messenger. Legal Funnel is MLA''s preferred CRM (they created it).', 'active');
