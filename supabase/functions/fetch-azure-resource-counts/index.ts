import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting fetch-azure-resource-counts function')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the request authorization header
    const authHeader = req.headers.get('authorization')?.split(' ')[1]
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    if (userError || !user) {
      console.error('Error getting user:', userError)
      throw new Error('Unauthorized')
    }

    console.log('Fetching Azure connection for user:', user.id)

    // Get Azure credentials with explicit user_id check
    const { data: connections, error: connectionError } = await supabaseClient
      .from('cloud_provider_connections')
      .select('*')
      .eq('provider', 'azure')
      .eq('is_active', true)
      .eq('user_id', user.id)
      .single()

    if (connectionError) {
      console.error('Error fetching Azure connection:', connectionError)
      throw new Error('Error fetching Azure connection')
    }

    if (!connections) {
      console.error('No active Azure connection found for user:', user.id)
      throw new Error('No active Azure connection found')
    }

    if (!connections.credentials?.subscriptionId) {
      console.error('Invalid Azure credentials - missing subscriptionId')
      throw new Error('Invalid Azure credentials')
    }

    console.log('Found active Azure connection')

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
    
    if (!tokenData.access_token) {
      console.error('Failed to get Azure token:', tokenData)
      throw new Error('Failed to authenticate with Azure')
    }

    console.log('Successfully obtained Azure token')

    // Fetch resources in parallel
    const [vmResponse, sqlResponse, storageResponse] = await Promise.all([
      // Get VM count
      fetch(
        `https://management.azure.com/subscriptions/${connections.credentials.subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-07-01`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      ),
      // Get SQL Database count
      fetch(
        `https://management.azure.com/subscriptions/${connections.credentials.subscriptionId}/providers/Microsoft.Sql/servers?api-version=2023-02-01-preview`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      ),
      // Get Storage Account count
      fetch(
        `https://management.azure.com/subscriptions/${connections.credentials.subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      )
    ])

    const [vmData, sqlData, storageData] = await Promise.all([
      vmResponse.json(),
      sqlResponse.json(),
      storageResponse.json()
    ])

    console.log('Successfully fetched Azure resources')

    // Calculate resource counts
    const resourceCounts = [
      {
        resource_type: 'Virtual Machines',
        count: vmData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100), // This would ideally be calculated from actual metrics
      },
      {
        resource_type: 'SQL Databases',
        count: sqlData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
      },
      {
        resource_type: 'Storage Accounts',
        count: storageData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
      },
    ]

    // Update resource counts in Supabase
    const { error: upsertError } = await supabaseClient
      .from('azure_resource_counts')
      .upsert(
        resourceCounts.map(resource => ({
          user_id: user.id,
          resource_type: resource.resource_type,
          count: resource.count,
          usage_percentage: resource.usage_percentage,
          last_updated_at: new Date().toISOString(),
        }))
      )

    if (upsertError) {
      console.error('Error upserting resource counts:', upsertError)
      throw upsertError
    }

    console.log('Successfully updated resource counts in database')

    return new Response(
      JSON.stringify({ success: true, data: resourceCounts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-azure-resource-counts:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})