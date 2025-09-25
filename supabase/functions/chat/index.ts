
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Chat function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { message, sessionId, userEmail } = requestBody;
    
    if (!message || !sessionId) {
      console.error('Missing required fields:', { message: !!message, sessionId: !!sessionId });
      return new Response(JSON.stringify({ error: 'Message and sessionId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    
    console.log('Environment variables check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      openRouterKey: !!openRouterKey
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!openRouterKey) {
      console.error('Missing OpenRouter API key');
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get chatbot instructions
    console.log('Fetching chatbot instructions...');
    const { data: instructions, error: instructionsError } = await supabase
      .from('chatbot_instructions')
      .select('instruction_text')
      .eq('is_active', true)
      .order('priority');

    if (instructionsError) {
      console.error('Error fetching instructions:', instructionsError);
    }

    // Get knowledge base content
    console.log('Fetching knowledge base...');
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('content')
      .eq('status', 'active')
      .limit(5);

    if (knowledgeError) {
      console.error('Error fetching knowledge base:', knowledgeError);
    }

    // Build system prompt
    let systemPrompt = instructions?.map(i => i.instruction_text).join('\n') || 
      'You are Ava, an AI assistant trained on the AI-First Masterclass for lawyers.';
    
    if (knowledge && knowledge.length > 0) {
      systemPrompt += '\n\nRelevant knowledge base content:\n' + 
        knowledge.map(k => k.content).join('\n\n');
    }

    console.log('System prompt length:', systemPrompt.length);

    const startTime = Date.now();

    // Make request to OpenRouter
    console.log('Making request to OpenRouter...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-track-masterclass.lovable.app',
        'X-Title': 'AI Track Masterclass Chat'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenRouter:', data);
      throw new Error('Invalid response from OpenRouter API');
    }
    
    const aiResponse = data.choices[0].message.content;
    const responseTime = Date.now() - startTime;

    console.log('Saving analytics with email:', userEmail);
    // Save to analytics with user email
    const { error: analyticsError } = await supabase.from('chat_analytics').insert({
      session_id: sessionId,
      user_message: message,
      ai_response: aiResponse,
      response_time_ms: responseTime,
      tokens_used: data.usage?.total_tokens || null,
      user_email: userEmail || 'anonymous@example.com'
    });

    if (analyticsError) {
      console.error('Error saving analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    console.log('Chat request completed successfully');
    return new Response(JSON.stringify({ 
      response: aiResponse,
      responseTime 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
