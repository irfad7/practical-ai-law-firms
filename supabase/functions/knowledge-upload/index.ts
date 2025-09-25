
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Knowledge upload function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Received request body:', { 
      hasFilename: !!requestBody.filename,
      hasContent: !!requestBody.content,
      hasFileType: !!requestBody.fileType,
      contentLength: requestBody.content?.length 
    });
    
    const { filename, content, fileType, fileSize } = requestBody;
    
    if (!filename || !content || !fileType) {
      console.error('Missing required fields:', { filename: !!filename, content: !!content, fileType: !!fileType });
      return new Response(JSON.stringify({ 
        error: 'Filename, content, and fileType are required',
        details: 'Please ensure all required fields are provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        details: 'Missing required environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert into knowledge base
    console.log('Inserting document into knowledge_base table');
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        filename,
        file_type: fileType,
        content,
        file_size: fileSize || null,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save document to database',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Document successfully inserted:', data.id);
    return new Response(JSON.stringify({ 
      success: true,
      document: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Knowledge upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload document',
      details: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
