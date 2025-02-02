import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Azure credentials from cloud_provider_connections
    const { data: connections, error: connectionError } = await supabaseClient
      .from('cloud_provider_connections')
      .select('*')
      .eq('provider', 'azure')
      .eq('is_active', true)
      .single()

    if (connectionError || !connections) {
      throw new Error('No active Azure connection found')
    }

    const credentials = connections.credentials

    // Get Azure access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${Deno.env.get('AZURE_TENANT_ID')}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: Deno.env.get('AZURE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('AZURE_CLIENT_SECRET') ?? '',
          scope: 'https://management.azure.com/.default',
        }),
      }
    )

    const tokenData = await tokenResponse.json()
    
    // Fetch cost data from Azure Cost Management API
    const costResponse = await fetch(
      `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ActualCost',
          timeframe: 'MonthToDate',
          dataset: {
            granularity: 'Daily',
            aggregation: {
              totalCost: {
                name: 'Cost',
                function: 'Sum',
              },
            },
          },
        }),
      }
    )

    const costData = await costResponse.json()

    // Store the cost data in Supabase
    const { error: updateError } = await supabaseClient
      .from('cloud_resources')
      .upsert({
        user_id: connections.user_id,
        provider: 'azure',
        resource_id: 'cost-data',
        resource_type: 'cost',
        name: 'Azure Costs',
        cost_data: costData,
        last_updated_at: new Date().toISOString(),
      })

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, data: costData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})