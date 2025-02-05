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

    try {
      const { data: connections, error: connectionError } = await supabaseClient
        .from('cloud_provider_connections')
        .select('*')
        .eq('provider', 'azure')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (connectionError) {
        console.error('Error fetching Azure connections:', connectionError)
        throw connectionError
      }

      if (!connections || connections.length === 0) {
        console.error('No active Azure connections found')
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

      // Use the most recently updated connection
      const activeConnection = connections.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0]

      console.log('Found Azure connection:', activeConnection)

      const { credentials } = activeConnection

      if (!credentials?.clientId || !credentials?.clientSecret || !credentials?.tenantId || !credentials?.subscriptionId) {
        console.error('Invalid Azure credentials structure:', credentials)
        await supabaseClient
          .from('cloud_provider_connections')
          .update({ is_active: false })
          .eq('id', activeConnection.id)

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

      try {
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
            .eq('id', activeConnection.id)

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

        console.log('Successfully obtained Azure token')

        await supabaseClient
          .from('cloud_provider_connections')
          .update({ 
            last_sync_at: new Date().toISOString(),
            is_active: true 
          })
          .eq('id', activeConnection.id)

        try {
          console.log('Fetching Azure resources...')
          const responses = await Promise.all([
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
            ),
            fetch(
              `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Web/sites?api-version=2022-03-01`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              }
            ),
            fetch(
              `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.ContainerService/managedClusters?api-version=2023-07-02-preview`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              }
            ),
            fetch(
              `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.DocumentDB/databaseAccounts?api-version=2023-09-15`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              }
            ),
            fetch(
              `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.CognitiveServices/accounts?api-version=2023-05-01`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              }
            ),
            fetch(
              `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.CognitiveServices/accounts?api-version=2023-05-01`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              }
            ),
            fetch(
              `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.App/containerApps?api-version=2023-05-01`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                },
              }
            )
          ]);

          // Check if any response failed
          for (let i = 0; i < responses.length; i++) {
            if (!responses[i].ok) {
              const errorText = await responses[i].text();
              console.error(`Error in request ${i}:`, errorText);
              throw new Error(`Failed to fetch Azure resources: ${responses[i].statusText}`);
            }
          }

          // Parse all responses
          const [
            vmResponse,
            sqlResponse,
            storageResponse,
            webAppsResponse,
            aksResponse,
            cosmosResponse,
            cognitiveResponse,
            openaiResponse,
            containerAppsResponse
          ] = responses;

          const [
            vmData,
            sqlData,
            storageData,
            webAppsData,
            aksData,
            cosmosData,
            cognitiveData,
            openaiData,
            containerAppsData
          ] = await Promise.all([
            vmResponse.json(),
            sqlResponse.json(),
            storageResponse.json(),
            webAppsResponse.json(),
            aksResponse.json(),
            cosmosResponse.json(),
            cognitiveResponse.json(),
            openaiResponse.json(),
            containerAppsResponse.json()
          ]);

          console.log('Successfully fetched Azure resources')

          try {
            // Delete existing resource counts for this user
            await supabaseClient
              .from('azure_resource_counts')
              .delete()
              .eq('user_id', user.id)

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
              {
                resource_type: 'App Services',
                count: webAppsData.value?.length || 0,
                usage_percentage: Math.floor(Math.random() * 100),
              },
              {
                resource_type: 'Kubernetes Clusters',
                count: aksData.value?.length || 0,
                usage_percentage: Math.floor(Math.random() * 100),
              },
              {
                resource_type: 'Cosmos DB',
                count: cosmosData.value?.length || 0,
                usage_percentage: Math.floor(Math.random() * 100),
              },
              {
                resource_type: 'Cognitive Services',
                count: cognitiveData.value?.length || 0,
                usage_percentage: Math.floor(Math.random() * 100),
              },
              {
                resource_type: 'Azure OpenAI',
                count: openaiData.value?.filter((service: any) => 
                  service.kind?.toLowerCase().includes('openai'))?.length || 0,
                usage_percentage: Math.floor(Math.random() * 100),
              },
              {
                resource_type: 'Container Apps',
                count: containerAppsData.value?.length || 0,
                usage_percentage: Math.floor(Math.random() * 100),
              }
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
            throw error
          }
        } catch (error) {
          console.error('Error fetching Azure resources:', error)
          throw error
        }
      } catch (error) {
        console.error('Error getting Azure token:', error)
        throw error
      }
    } catch (error) {
      console.error('Database error:', error)
      throw error
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
