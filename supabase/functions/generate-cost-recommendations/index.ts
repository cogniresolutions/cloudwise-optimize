import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAIClient } from "https://esm.sh/@azure/openai@1.0.0-beta.11"
import { AzureKeyCredential } from "https://esm.sh/@azure/core-auth@1.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { resource } = await req.json()

    console.log('Generating recommendations for resource:', resource.resource_type)

    const client = new OpenAIClient(
      Deno.env.get('AZURE_OPENAI_ENDPOINT')!,
      new AzureKeyCredential(Deno.env.get('AZURE_OPENAI_API_KEY')!)
    )

    const prompt = `You are an Azure cost optimization assistant. Analyze the following Azure resource details and provide accurate, actionable cost-saving recommendations:

    Resource Type: ${resource.resource_type}
    Count: ${resource.count}
    Usage Percentage: ${resource.usage_percentage}%
    Monthly Cost: ${resource.cost} USD

    Focus on:
    1. Scaling opportunities
    2. Resource allocation efficiency
    3. Reserved instance recommendations
    4. Specific Azure cost management best practices
    
    Provide clear, actionable steps.`

    const response = await client.getCompletions('gpt-35-turbo', [{ text: prompt }], {
      maxTokens: 200,
      temperature: 0.7,
    })

    return new Response(
      JSON.stringify({
        recommendation: response.choices[0].text.trim(),
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})