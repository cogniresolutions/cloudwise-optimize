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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No authorization header provided'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    console.log('Fetching Azure connections for user:', user.id)

    const { data: connections, error: connectionError } = await supabaseClient
      .from('cloud_provider_connections')
      .select('*')
      .eq('provider', 'azure')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connectionError) {
      console.error('Error fetching Azure connection:', connectionError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch Azure connection'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    if (!connections) {
      console.error('No active Azure connection found')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active Azure connection found'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    const { credentials } = connections

    if (!credentials?.clientId || !credentials?.clientSecret || !credentials?.tenantId || !credentials?.subscriptionId) {
      console.error('Invalid Azure credentials structure')
      await supabaseClient
        .from('cloud_provider_connections')
        .update({ is_active: false })
        .eq('id', connections.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Azure credentials configuration'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('Getting Azure access token')

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

      return new Response(
        JSON.stringify({
          success: false,
          error: tokenData.error === 'invalid_client' 
            ? 'Invalid Azure credentials. Please verify your Client ID and Client Secret are correct.'
            : 'Failed to authenticate with Azure: ' + (tokenData.error_description || 'Invalid credentials')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    await supabaseClient
      .from('cloud_provider_connections')
      .update({ 
        last_sync_at: new Date().toISOString(),
        is_active: true 
      })
      .eq('id', connections.id)

    console.log('Successfully obtained Azure token, fetching resources')

    const [vmResponse, sqlResponse, storageResponse] = await Promise.all([
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-07-01`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Sql/servers?api-version=2023-02-01-preview`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      ),
      fetch(
        `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      )
    ])

    if (!vmResponse.ok || !sqlResponse.ok || !storageResponse.ok) {
      const failedResponse = !vmResponse.ok ? vmResponse : !sqlResponse.ok ? sqlResponse : storageResponse
      const errorText = await failedResponse.text()
      console.error('Failed to fetch resources:', errorText)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch Azure resources: ${failedResponse.status} ${failedResponse.statusText}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: failedResponse.status
        }
      )
    }

    const [vmData, sqlData, storageData] = await Promise.all([
      vmResponse.json(),
      sqlResponse.json(),
      storageResponse.json()
    ])

    console.log('Successfully fetched Azure resources')

    try {
      // Delete existing resource counts for this user
      const { error: deleteError } = await supabaseClient
        .from('azure_resource_counts')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting existing resource counts:', deleteError)
        throw deleteError
      }

      // Insert new resource counts
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

      const { error: insertError } = await supabaseClient
        .from('azure_resource_counts')
        .insert(resourceCounts.map(resource => ({
          user_id: user.id,
          resource_type: resource.resource_type,
          count: resource.count,
          usage_percentage: resource.usage_percentage,
          last_updated_at: new Date().toISOString(),
        })))

      if (insertError) {
        console.error('Error inserting resource counts:', insertError)
        throw insertError
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
      console.error('Error storing resource counts:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to store resource counts'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }
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