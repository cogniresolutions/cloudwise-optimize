import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY')!;
const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Received request to analyze costs');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { costData, resourceData } = await req.json();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      console.error('User ID is missing from request');
      throw new Error('User ID is required');
    }

    console.log('Analyzing costs for user:', userId);
    console.log('Cost data:', JSON.stringify(costData));
    console.log('Resource data:', JSON.stringify(resourceData));

    if (!costData?.length) {
      console.log('No cost data provided for analysis');
      return new Response(
        JSON.stringify({ 
          error: 'No cost data available for analysis',
          recommendations: [] 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare the prompt for cost analysis
    const prompt = `Analyze the following cloud resource cost data and provide optimization recommendations:
    Cost Data: ${JSON.stringify(costData)}
    Resource Data: ${JSON.stringify(resourceData)}
    
    Please provide:
    1. Cost trends and patterns
    2. Potential cost optimization opportunities
    3. Specific recommendations for cost reduction
    4. Priority level for each recommendation (High/Medium/Low)
    5. Estimated potential savings in dollars
    
    Format your response as a clear, actionable list of recommendations.`;

    console.log('Sending request to Azure OpenAI');
    // Call Azure OpenAI API
    const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a cloud cost optimization expert. Analyze the provided data and give specific, actionable recommendations with clear potential savings estimates.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('Azure OpenAI API error:', response.statusText);
      throw new Error(`Azure OpenAI API error: ${response.statusText}`);
    }

    const analysisResult = await response.json();
    console.log('AI Analysis completed:', JSON.stringify(analysisResult));

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse the AI response to extract recommendations
    const aiContent = analysisResult.choices[0].message.content;
    
    // Store multiple recommendations based on the AI analysis
    const recommendations = parseRecommendations(aiContent);
    console.log('Parsed recommendations:', JSON.stringify(recommendations));
    
    // Delete existing recommendations for this user and provider
    console.log('Deleting existing recommendations');
    const { error: deleteError } = await supabase
      .from('cost_recommendations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', resourceData.provider);

    if (deleteError) {
      console.error('Error deleting existing recommendations:', deleteError);
      throw deleteError;
    }

    // Insert new recommendations
    console.log('Inserting new recommendations');
    const { data: insertedRecs, error: insertError } = await supabase
      .from('cost_recommendations')
      .insert(recommendations.map(rec => ({
        user_id: userId,
        provider: resourceData.provider,
        title: rec.title,
        description: rec.description,
        potential_savings: rec.savings,
        priority: rec.priority.toLowerCase(),
        resource_ids: resourceData.resourceIds,
        ai_analysis: analysisResult,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select();

    if (insertError) {
      console.error('Error inserting recommendations:', insertError);
      throw insertError;
    }

    console.log('Successfully inserted recommendations:', JSON.stringify(insertedRecs));

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations: insertedRecs,
        message: 'Cost analysis completed successfully'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-costs function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        recommendations: [],
        message: 'Failed to analyze costs'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseRecommendations(aiContent: string) {
  console.log('Parsing AI content for recommendations');
  // Split content into lines and process each recommendation
  const lines = aiContent.split('\n');
  const recommendations = [];
  let currentRec = null;

  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      // If we have a previous recommendation, save it
      if (currentRec) {
        recommendations.push(currentRec);
      }
      // Start a new recommendation
      currentRec = {
        title: line.replace(/^\d+\.\s*/, '').trim(),
        description: '',
        priority: 'Medium', // Default priority
        savings: 0,
      };
    } else if (currentRec) {
      // Add to current recommendation description
      if (line.toLowerCase().includes('priority')) {
        const priority = line.toLowerCase().includes('high') ? 'High' :
                        line.toLowerCase().includes('low') ? 'Low' : 'Medium';
        currentRec.priority = priority;
      } else if (line.toLowerCase().includes('saving')) {
        const savingsMatch = line.match(/\$?\d+(\.\d+)?/);
        if (savingsMatch) {
          currentRec.savings = parseFloat(savingsMatch[0].replace('$', ''));
        }
      } else if (line.trim()) {
        currentRec.description += (currentRec.description ? '\n' : '') + line.trim();
      }
    }
  }

  // Don't forget to add the last recommendation
  if (currentRec) {
    recommendations.push(currentRec);
  }

  // If no recommendations were parsed, create a default one
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Initial Cost Analysis',
      description: 'We are currently analyzing your cloud resource usage patterns. More specific recommendations will be provided as we gather more data.',
      priority: 'Medium',
      savings: 0
    });
  }

  console.log('Parsed recommendations:', JSON.stringify(recommendations));
  return recommendations;
}