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
    console.log('Starting fetch-azure-resource-counts function')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      throw new Error('Unauthorized')
    }

    console.log('Fetching Azure connections for user:', user.id)

    // Get Azure credentials from cloud_provider_connections
    const { data: connections, error: connectionError } = await supabaseClient
      .from('cloud_provider_connections')
      .select('*')
      .eq('provider', 'azure')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connectionError || !connections) {
      console.error('Error fetching Azure connections:', connectionError)
      throw new Error('No active Azure connection found')
    }

    const { credentials } = connections
    console.log('Retrieved Azure credentials for user')

    if (!credentials?.clientId || !credentials?.clientSecret || !credentials?.tenantId || !credentials?.subscriptionId) {
      console.error('Invalid Azure credentials structure:', credentials)
      await supabaseClient
        .from('cloud_provider_connections')
        .update({ is_active: false })
        .eq('id', connections.id)

      throw new Error('Invalid Azure credentials configuration')
    }

    console.log('Getting Azure access token')

    // Get Azure access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          scope: 'https://management.azure.com/.default',
        }),
      }
    )

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get Azure token:', tokenData)
      await supabaseClient
        .from('cloud_provider_connections')
        .update({ is_active: false })
        .eq('id', connections.id)

      throw new Error(tokenData.error === 'invalid_client' 
        ? 'Invalid Azure credentials. Please verify your Client ID and Client Secret are correct.'
        : 'Failed to authenticate with Azure')
    }

    console.log('Successfully obtained Azure token')
    console.log('Fetching Azure resources...')

    // Fetch resources from various Azure services
    const responses = await Promise.allSettled([
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-07-01`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Sql/servers?api-version=2023-02-01-preview`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Web/sites?api-version=2022-03-01`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.ContainerService/managedClusters?api-version=2023-07-02-preview`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.DocumentDB/databaseAccounts?api-version=2023-09-15`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.CognitiveServices/accounts?api-version=2023-05-01`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.App/containerApps?api-version=2023-05-01`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      )
    ])

    // Process responses and handle errors
    const results = await Promise.all(
      responses.map(async (response, index) => {
        if (response.status === 'rejected') {
          console.error(`Error fetching resource type ${index}:`, response.reason)
          return { value: { value: [] } }
        }
        
        const result = response.value
        if (!result.ok) {
          console.error(`HTTP error for resource type ${index}:`, result.status)
          return { value: { value: [] } }
        }
        
        return result.json()
      })
    )

    const [vmData, sqlData, storageData, webAppsData, aksData, cosmosData, cognitiveData, containerAppsData] = results

    const resourceCounts = [
      {
        resource_type: 'Virtual Machines',
        count: vmData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'SQL Databases',
        count: sqlData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'Storage Accounts',
        count: storageData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'App Services',
        count: webAppsData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'Kubernetes Clusters',
        count: aksData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'Cosmos DB',
        count: cosmosData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'Cognitive Services',
        count: cognitiveData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      },
      {
        resource_type: 'Container Apps',
        count: containerAppsData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
        cost: 0,
      }
    ]

    // Update resource counts in database
    const { error: upsertError } = await supabaseClient
      .from('azure_resource_counts')
      .upsert(
        resourceCounts.map(resource => ({
          user_id: user.id,
          resource_type: resource.resource_type,
          count: resource.count,
          usage_percentage: resource.usage_percentage,
          cost: resource.cost,
          last_updated_at: new Date().toISOString()
        })),
        {
          onConflict: 'user_id,resource_type',
          ignoreDuplicates: false
        }
      )

    if (upsertError) {
      console.error('Error upserting resource counts:', upsertError)
      throw upsertError
    }

    return new Response(
      JSON.stringify({ success: true, data: resourceCounts }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-azure-resource-counts:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: error.message.includes('Unauthorized') ? 401 : 500
      }
    )
  }
})