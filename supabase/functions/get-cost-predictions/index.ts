import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAIClient } from "https://esm.sh/@azure/openai@1.0.0-beta.11";
import { AzureKeyCredential } from "https://esm.sh/@azure/core-auth@1.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get cost data from cloud_resources table
    const { data: costData, error: costError } = await supabaseClient
      .from('cloud_resources')
      .select('cost_data')
      .eq('resource_type', 'cost')
      .order('last_updated_at', { ascending: false })
      .limit(1)
      .single();

    if (costError) throw costError;

    // Process historical cost data
    const historicalCosts = costData?.cost_data?.properties?.rows || [];
    const processedData = historicalCosts.map((row: any) => ({
      month: new Date(row.date).toLocaleString('default', { month: 'short' }),
      cost: parseFloat(row.cost.toFixed(2)),
      savings: parseFloat((row.cost * 0.15).toFixed(2)) // Example savings calculation
    }));

    // Use Azure OpenAI to predict next month's costs
    const client = new OpenAIClient(
      "https://neuraconnect.openai.azure.com",
      new AzureKeyCredential(Deno.env.get('AZURE_OPENAI_API_KEY')!)
    );

    const prompt = `Based on this cost data for the last months: ${JSON.stringify(processedData)}, predict the cost and potential savings for the next month. Return only a JSON object with two numbers: predicted_cost and predicted_savings. Consider seasonality and trends.`;

    const response = await client.getChatCompletions("gpt-4o-mini", [
      { role: "system", content: "You are a cloud cost analysis AI. Provide predictions in JSON format." },
      { role: "user", content: prompt }
    ]);

    const prediction = JSON.parse(response.choices[0].message?.content || "{}");

    // Add prediction to the data
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    processedData.push({
      month: nextMonth.toLocaleString('default', { month: 'short' }),
      cost: parseFloat(prediction.predicted_cost.toFixed(2)),
      savings: parseFloat(prediction.predicted_savings.toFixed(2)),
      isPredicted: true
    });

    return new Response(
      JSON.stringify({ data: processedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});