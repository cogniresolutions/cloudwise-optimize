import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { ClientSecretCredential } from "https://esm.sh/@azure/identity@3.3.0"
import { ResourceManagementClient } from "https://esm.sh/@azure/arm-resources@5.2.0"
import { ComputeManagementClient } from "https://esm.sh/@azure/arm-compute@21.2.0"
import { SqlManagementClient } from "https://esm.sh/@azure/arm-sql@9.1.0"
import { StorageManagementClient } from "https://esm.sh/@azure/arm-storage@18.2.0"
import { ConsumptionManagementClient } from "https://esm.sh/@azure/arm-consumption@9.1.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function initializeAzureClients(credentials: any) {
  const credential = new ClientSecretCredential(
    credentials.tenantId,
    credentials.clientId,
    credentials.clientSecret
  );

  return {
    resourceClient: new ResourceManagementClient(credential, credentials.subscriptionId),
    computeClient: new ComputeManagementClient(credential, credentials.subscriptionId),
    sqlClient: new SqlManagementClient(credential, credentials.subscriptionId),
    storageClient: new StorageManagementClient(credential, credentials.subscriptionId),
    consumptionClient: new ConsumptionManagementClient(credential, credentials.subscriptionId)
  };
}

async function scanResources(supabaseClient: any, userId: string, clients: any) {
  const { resourceClient, computeClient, sqlClient, storageClient } = clients;
  
  // Get resource groups
  const resourceGroups = [];
  for await (const group of resourceClient.resourceGroups.list()) {
    if (group.name) {
      resourceGroups.push(group.name);
    }
  }

  console.log('Found resource groups:', resourceGroups);

  let vmCount = 0;
  let vmUsage = 0;
  let sqlCount = 0;
  let sqlUsage = 0;
  let storageCount = 0;
  let storageUsage = 0;

  // Count VMs and get their status
  for (const group of resourceGroups) {
    try {
      const vms = computeClient.virtualMachines.list(group);
      for await (const vm of vms) {
        vmCount++;
        const instanceView = await computeClient.virtualMachines.instanceView(group, vm.name || '');
        const isRunning = instanceView.statuses?.some(
          status => status.code?.toLowerCase().includes('running')
        );
        if (isRunning) {
          vmUsage += 100;
        }
      }
    } catch (error) {
      console.error(`Error processing VMs in group ${group}:`, error);
    }
  }
  vmUsage = vmCount > 0 ? Math.round(vmUsage / vmCount) : 0;

  // Count SQL databases
  for (const group of resourceGroups) {
    try {
      const servers = sqlClient.servers.listByResourceGroup(group);
      for await (const server of servers) {
        if (!server.name) continue;
        const databases = sqlClient.databases.listByServer(group, server.name);
        for await (const db of databases) {
          sqlCount++;
          sqlUsage += 75; // Assuming active databases are at 75% usage
        }
      }
    } catch (error) {
      console.error(`Error processing SQL databases in group ${group}:`, error);
    }
  }
  sqlUsage = sqlCount > 0 ? Math.round(sqlUsage / sqlCount) : 0;

  // Count storage accounts
  for (const group of resourceGroups) {
    try {
      const accounts = storageClient.storageAccounts.listByResourceGroup(group);
      for await (const account of accounts) {
        storageCount++;
        storageUsage += 60; // Assuming active storage accounts are at 60% usage
      }
    } catch (error) {
      console.error(`Error processing storage accounts in group ${group}:`, error);
    }
  }
  storageUsage = storageCount > 0 ? Math.round(storageUsage / storageUsage) : 0;

  // Update resource counts in database with real-time data
  const { error: countError } = await supabaseClient
    .from('azure_resource_counts')
    .upsert([
      { 
        user_id: userId, 
        resource_type: 'Virtual Machines', 
        count: vmCount, 
        usage_percentage: vmUsage,
        last_updated_at: new Date().toISOString()
      },
      { 
        user_id: userId, 
        resource_type: 'SQL Databases', 
        count: sqlCount, 
        usage_percentage: sqlUsage,
        last_updated_at: new Date().toISOString()
      },
      { 
        user_id: userId, 
        resource_type: 'Storage Accounts', 
        count: storageCount, 
        usage_percentage: storageUsage,
        last_updated_at: new Date().toISOString()
      }
    ], {
      onConflict: 'user_id,resource_type'
    });

  if (countError) {
    throw countError;
  }

  return {
    vmCount,
    sqlCount,
    storageCount,
    vmUsage,
    sqlUsage,
    storageUsage
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Fetching Azure credentials for user:', userId);

    // Get Azure credentials from cloud_provider_connections
    const { data: connectionData, error: connectionError } = await supabaseClient
      .from('cloud_provider_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'azure')
      .eq('is_active', true)
      .single();

    if (connectionError || !connectionData) {
      throw new Error('No active Azure connection found');
    }

    const credentials = connectionData.credentials;
    console.log('Retrieved Azure credentials for:', {
      clientId: credentials.clientId,
      tenantId: credentials.tenantId,
      subscriptionId: credentials.subscriptionId,
    });

    // Initialize Azure clients
    const clients = await initializeAzureClients(credentials);
    
    // Scan resources and update database
    const resourceData = await scanResources(supabaseClient, userId, clients);

    // Update last sync timestamp
    await supabaseClient
      .from('cloud_provider_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'azure');

    return new Response(JSON.stringify(resourceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error scanning Azure resources:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});