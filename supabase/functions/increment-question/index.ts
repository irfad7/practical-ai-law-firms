
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First try to find existing question
    const { data: existing } = await supabase
      .from('popular_questions')
      .select('*')
      .eq('question_text', question)
      .single();

    if (existing) {
      // Update frequency
      await supabase
        .from('popular_questions')
        .update({ 
          frequency: existing.frequency + 1,
          last_asked: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Insert new question
      await supabase
        .from('popular_questions')
        .insert({
          question_text: question,
          frequency: 1,
          category: 'general'
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Question tracking error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to track question',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
