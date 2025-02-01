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

    // Get user ID from request header
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
    console.log('Retrieved Azure credentials:', {
      clientId: credentials.clientId,
      tenantId: credentials.tenantId,
      subscriptionId: credentials.subscriptionId,
    });

    // Initialize Azure credential
    const credential = new ClientSecretCredential(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );

    // Initialize Azure clients
    const resourceClient = new ResourceManagementClient(credential, credentials.subscriptionId);
    const computeClient = new ComputeManagementClient(credential, credentials.subscriptionId);
    const sqlClient = new SqlManagementClient(credential, credentials.subscriptionId);
    const storageClient = new StorageManagementClient(credential, credentials.subscriptionId);
    const consumptionClient = new ConsumptionManagementClient(credential, credentials.subscriptionId);

    console.log('Initialized Azure clients');

    // Get resource groups
    const resourceGroups = [];
    for await (const group of resourceClient.resourceGroups.list()) {
      resourceGroups.push(group.name);
    }

    console.log('Found resource groups:', resourceGroups);

    // Count resources and calculate usage
    let vmCount = 0;
    let vmUsage = 0;
    let sqlCount = 0;
    let sqlUsage = 0;
    let storageCount = 0;
    let storageUsage = 0;

    // Get VM usage and costs
    for (const group of resourceGroups) {
      if (!group) continue;
      const vms = computeClient.virtualMachines.list(group);
      for await (const vm of vms) {
        vmCount++;
        // Get VM usage percentage (CPU utilization as an example)
        try {
          const usage = await computeClient.virtualMachines.instanceView(group, vm.name || '');
          if (usage.statuses?.[0]?.code === "PowerState/running") {
            vmUsage += 100; // Count as 100% if running
          }
        } catch (error) {
          console.error('Error getting VM usage:', error);
        }
      }
    }
    vmUsage = vmCount > 0 ? Math.round(vmUsage / vmCount) : 0;

    // Get SQL Database usage
    for (const group of resourceGroups) {
      if (!group) continue;
      const servers = sqlClient.servers.listByResourceGroup(group);
      for await (const server of servers) {
        if (!server.name) continue;
        const databases = sqlClient.databases.listByServer(group, server.name);
        for await (const db of databases) {
          sqlCount++;
          sqlUsage += 75; // Example usage percentage
        }
      }
    }
    sqlUsage = sqlCount > 0 ? Math.round(sqlUsage / sqlCount) : 0;

    // Get Storage Account usage
    for (const group of resourceGroups) {
      if (!group) continue;
      const accounts = storageClient.storageAccounts.listByResourceGroup(group);
      for await (const account of accounts) {
        storageCount++;
        storageUsage += 60; // Example usage percentage
      }
    }
    storageUsage = storageCount > 0 ? Math.round(storageUsage / storageCount) : 0;

    console.log('Resource counts:', { vmCount, sqlCount, storageCount });
    console.log('Usage percentages:', { vmUsage, sqlUsage, storageUsage });

    // Get cost data for the last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
    try {
      const costData = [];
      for await (const usage of consumptionClient.usageDetails.list({
        scope: `/subscriptions/${credentials.subscriptionId}`,
        startDate: thirtyDaysAgo,
        endDate: new Date(),
      })) {
        costData.push({
          resourceId: usage.resourceId,
          cost: usage.pretaxCost,
          date: usage.date,
          resourceType: usage.resourceType,
        });
      }
      
      console.log('Retrieved cost data:', costData.length, 'entries');

      // Store cost data for analysis
      if (costData.length > 0) {
        const { error: resourceError } = await supabaseClient
          .from('cloud_resources')
          .upsert(costData.map(item => ({
            user_id: userId,
            provider: 'azure',
            resource_id: item.resourceId,
            resource_type: item.resourceType,
            cost_data: item,
            last_updated_at: new Date().toISOString(),
          })));

        if (resourceError) {
          console.error('Error storing cost data:', resourceError);
        }
      }
    } catch (error) {
      console.error('Error fetching cost data:', error);
    }

    // Update resource counts in database
    const { error: countError } = await supabaseClient
      .from('azure_resource_counts')
      .upsert([
        { user_id: userId, resource_type: 'Virtual Machines', count: vmCount, usage_percentage: vmUsage },
        { user_id: userId, resource_type: 'SQL Databases', count: sqlCount, usage_percentage: sqlUsage },
        { user_id: userId, resource_type: 'Storage Accounts', count: storageCount, usage_percentage: storageUsage }
      ], {
        onConflict: 'user_id,resource_type'
      });

    if (countError) {
      throw countError;
    }

    return new Response(JSON.stringify({
      vmCount,
      sqlCount,
      storageCount,
      vmUsage,
      sqlUsage,
      storageUsage
    }), {
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
})