import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { DefaultAzureCredential } from 'https://esm.sh/@azure/identity@3.3.0'
import { ResourceManagementClient } from 'https://esm.sh/@azure/arm-resources@5.2.0'
import { ComputeManagementClient } from 'https://esm.sh/@azure/arm-compute@21.2.0'
import { SqlManagementClient } from 'https://esm.sh/@azure/arm-sql@9.1.0'
import { StorageManagementClient } from 'https://esm.sh/@azure/arm-storage@18.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Azure credentials
    const credential = new DefaultAzureCredential()
    const subscriptionId = Deno.env.get('AZURE_SUBSCRIPTION_ID')

    if (!subscriptionId) {
      throw new Error('Azure subscription ID not configured')
    }

    // Initialize Azure clients
    const resourceClient = new ResourceManagementClient(credential, subscriptionId)
    const computeClient = new ComputeManagementClient(credential, subscriptionId)
    const sqlClient = new SqlManagementClient(credential, subscriptionId)
    const storageClient = new StorageManagementClient(credential, subscriptionId)

    // Get resource groups
    const resourceGroups = []
    for await (const group of resourceClient.resourceGroups.list()) {
      resourceGroups.push(group.name)
    }

    // Count resources
    let vmCount = 0
    let sqlCount = 0
    let storageCount = 0

    // Count VMs
    for (const group of resourceGroups) {
      if (!group) continue
      const vms = computeClient.virtualMachines.list(group)
      for await (const vm of vms) {
        vmCount++
      }
    }

    // Count SQL databases
    for (const group of resourceGroups) {
      if (!group) continue
      const servers = sqlClient.servers.listByResourceGroup(group)
      for await (const server of servers) {
        if (!server.name) continue
        const databases = sqlClient.databases.listByServer(group, server.name)
        for await (const db of databases) {
          sqlCount++
        }
      }
    }

    // Count storage accounts
    for (const group of resourceGroups) {
      if (!group) continue
      const accounts = storageClient.storageAccounts.listByResourceGroup(group)
      for await (const account of accounts) {
        storageCount++
      }
    }

    // Update database
    const { error } = await supabaseClient.from('azure_resource_counts')
      .upsert([
        { resource_type: 'Virtual Machines', count: vmCount },
        { resource_type: 'SQL Databases', count: sqlCount },
        { resource_type: 'Storage Accounts', count: storageCount }
      ], {
        onConflict: 'resource_type'
      })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      vmCount,
      sqlCount,
      storageCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error scanning Azure resources:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})