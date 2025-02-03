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

    console.log('Fetching Azure connections for user:', user.id)

    // Get Azure credentials for the user - now handling multiple connections
    const { data: connections, error: connectionError } = await supabaseClient
      .from('cloud_provider_connections')
      .select('*')
      .eq('provider', 'azure')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (connectionError) {
      console.error('Error fetching Azure connections:', connectionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error fetching Azure connections',
          details: connectionError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    if (!connections || connections.length === 0) {
      console.log('No active Azure connections found for user:', user.id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active Azure connections found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // Use the first active connection
    const connection = connections[0]
    console.log('Using Azure connection:', connection.id)

    // Validate Azure credentials structure
    const { credentials } = connection
    if (!credentials) {
      console.error('No credentials found in connection')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Azure credentials configuration - missing credentials' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate each required credential field and format
    const requiredFields = ['clientId', 'clientSecret', 'tenantId', 'subscriptionId']
    const missingFields = requiredFields.filter(field => !credentials[field])
    
    if (missingFields.length > 0) {
      console.error('Missing required Azure credentials:', missingFields)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid Azure credentials configuration - missing fields: ${missingFields.join(', ')}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Validate client secret format (should be a long string, not a UUID-like ID)
    if (credentials.clientSecret.length < 32 || credentials.clientSecret.includes('-')) {
      console.error('Invalid client secret format - appears to be an ID instead of the secret value')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid client secret format. Please provide the actual secret value, not the secret ID.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('Getting Azure access token')

    // Get Azure access token with detailed error handling
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to authenticate with Azure',
          details: tokenData.error_description || 'Token request failed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    console.log('Successfully obtained Azure token, fetching resources')

    // Fetch resources in parallel with proper error handling
    const resourceResponses = await Promise.allSettled([
      // Get VM count
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-07-01`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      ),
      // Get SQL Database count
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Sql/servers?api-version=2023-02-01-preview`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      ),
      // Get Storage Account count
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      )
    ])

    // Process responses and handle errors
    const [vmResponse, sqlResponse, storageResponse] = await Promise.all(
      resourceResponses.map(async (response) => {
        if (response.status === 'rejected') {
          console.error('Resource fetch failed:', response.reason)
          return { value: { json: async () => ({ value: [] }) } }
        }
        if (!response.value.ok) {
          console.error('Resource fetch error:', await response.value.text())
          return { value: { json: async () => ({ value: [] }) } }
        }
        return response
      })
    )

    const [vmData, sqlData, storageData] = await Promise.all([
      vmResponse.value.json(),
      sqlResponse.value.json(),
      storageResponse.value.json()
    ])

    console.log('Successfully fetched Azure resources')

    // Calculate resource counts and random usage percentages (for demo)
    const resourceCounts = [
      {
        resource_type: 'Virtual Machines',
        count: vmData.value?.length || 0,
        usage_percentage: Math.floor(Math.random() * 100),
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

    // Update last sync timestamp
    const { error: updateError } = await supabaseClient
      .from('cloud_provider_connections')
      .update({ 
        last_sync_at: new Date().toISOString(),
        is_active: true
      })
      .eq('id', connection.id)

    if (updateError) {
      console.error('Error updating last sync timestamp:', updateError)
    }

    // Update resource counts in database
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update resource counts in database',
          details: upsertError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log('Successfully updated resource counts in database')

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: resourceCounts 
      }),
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
        details: error.stack
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