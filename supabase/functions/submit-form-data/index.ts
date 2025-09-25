import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.json()
    
    // Forward the request to the external API
    const response = await fetch('https://services.leadconnectorhq.com/hooks/ZagsPZYtgGBI8NXDOeBA/webhook-trigger/536f8a6a-97c7-4dde-b9b1-0d7ceb439e97', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const responseData = await response.text()
    
    return new Response(responseData, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error forwarding request:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to submit form data' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})