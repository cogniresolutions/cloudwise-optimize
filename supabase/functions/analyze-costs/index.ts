import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY')!;
const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { costData, resourceData } = await req.json();

    // Prepare the prompt for cost analysis
    const prompt = `Analyze the following cloud resource cost data and provide optimization recommendations:
    Cost Data: ${JSON.stringify(costData)}
    Resource Data: ${JSON.stringify(resourceData)}
    
    Please provide:
    1. Cost trends and patterns
    2. Potential cost optimization opportunities
    3. Specific recommendations for cost reduction
    4. Priority level for each recommendation (High/Medium/Low)`;

    const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a cloud cost optimization expert. Analyze the provided data and give specific, actionable recommendations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const analysisResult = await response.json();
    console.log('AI Analysis completed:', analysisResult);

    // Store the analysis in the cost_recommendations table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: recommendation, error } = await supabaseClient
      .from('cost_recommendations')
      .insert({
        user_id: req.headers.get('x-user-id'),
        provider: resourceData.provider,
        title: 'AI Cost Analysis',
        description: analysisResult.choices[0].message.content,
        potential_savings: calculatePotentialSavings(costData),
        priority: 'high',
        resource_ids: resourceData.resourceIds,
        ai_analysis: analysisResult,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(recommendation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-costs function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculatePotentialSavings(costData: any) {
  // Implement basic savings calculation logic
  // This is a simplified example - you may want to make this more sophisticated
  const totalCost = costData.reduce((acc: number, curr: any) => acc + curr.cost, 0);
  return totalCost * 0.2; // Assume 20% potential savings
}