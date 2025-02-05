import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAIClient } from "https://esm.sh/@azure/openai@1.0.0-beta.11"
import { AzureKeyCredential } from "https://esm.sh/@azure/core-auth@1.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resource } = await req.json()

    const endpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT')
    const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY')

    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured')
    }

    const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey))

    const prompt = `You are an Azure cost optimization assistant. Analyze the following Azure resource details and provide accurate, actionable cost-saving recommendations:

    Resource Type: ${resource.resource_type}
    Count: ${resource.count}
    Usage Percentage: ${resource.usage_percentage}%
    Monthly Cost: ${resource.cost} USD

    Focus on:
    1. Cost efficiency
    2. Resource optimization
    3. Specific actionable steps
    4. Potential savings estimates
    
    Keep the response concise and practical.`

    const response = await client.getCompletions('gpt-35-turbo', [{ text: prompt }], {
      maxTokens: 150,
      temperature: 0.7,
    })

    const recommendation = response.choices[0].text.trim()

    return new Response(
      JSON.stringify({ recommendation }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})