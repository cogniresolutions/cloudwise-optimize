import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ClientSecretCredential } from "https://esm.sh/@azure/identity@3.3.0";
import { ResourceManagementClient } from "https://esm.sh/@azure/arm-resources@5.2.0";
import { ComputeManagementClient } from "https://esm.sh/@azure/arm-compute@21.2.0";
import { SqlManagementClient } from "https://esm.sh/@azure/arm-sql@9.1.0";
import { StorageManagementClient } from "https://esm.sh/@azure/arm-storage@18.2.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  console.log('Received request to scan Azure resources');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Processing request for user:', userId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Azure credentials for the user
    console.log('Fetching Azure credentials for user');
    const { data: connection, error: connectionError } = await supabase
      .from('cloud_provider_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'azure')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      console.error('Error fetching Azure connection:', connectionError);
      throw new Error('No active Azure connection found');
    }

    const credentials = connection.credentials;
    console.log('Retrieved Azure credentials for:', {
      clientId: credentials.clientId,
      tenantId: credentials.tenantId,
      subscriptionId: credentials.subscriptionId
    });

    // Initialize Azure clients
    const credential = new ClientSecretCredential(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );

    const resourceClient = new ResourceManagementClient(credential, credentials.subscriptionId);
    const computeClient = new ComputeManagementClient(credential, credentials.subscriptionId);
    const sqlClient = new SqlManagementClient(credential, credentials.subscriptionId);
    const storageClient = new StorageManagementClient(credential, credentials.subscriptionId);

    console.log('Initialized Azure clients successfully');

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

    // Count resources and calculate usage
    for (const group of resourceGroups) {
      try {
        console.log(`Scanning resources in group: ${group}`);

        // Virtual Machines
        const vms = await computeClient.virtualMachines.list(group);
        for await (const vm of vms) {
          vmCount++;
          if (vm.name) {
            const instanceView = await computeClient.virtualMachines.instanceView(group, vm.name);
            const isRunning = instanceView.statuses?.some(
              status => status.code?.toLowerCase().includes('running')
            );
            if (isRunning) {
              vmUsage += 100;
            }
          }
        }

        // SQL Databases
        const servers = await sqlClient.servers.listByResourceGroup(group);
        for await (const server of servers) {
          if (!server.name) continue;
          const databases = await sqlClient.databases.listByServer(group, server.name);
          for await (const db of databases) {
            sqlCount++;
            sqlUsage += 75; // Default usage value
          }
        }

        // Storage Accounts
        const accounts = await storageClient.storageAccounts.listByResourceGroup(group);
        for await (const account of accounts) {
          storageCount++;
          storageUsage += 60; // Default usage value
        }
      } catch (error) {
        console.error(`Error processing resources in group ${group}:`, error);
      }
    }

    // Calculate average usage percentages
    vmUsage = vmCount > 0 ? Math.round(vmUsage / vmCount) : 0;
    sqlUsage = sqlCount > 0 ? Math.round(sqlUsage / sqlCount) : 0;
    storageUsage = storageCount > 0 ? Math.round(storageUsage / storageCount) : 0;

    console.log('Resource counts:', { vmCount, sqlCount, storageCount });
    console.log('Usage percentages:', { vmUsage, sqlUsage, storageUsage });

    // Update resource counts in database
    const { error: countError } = await supabase
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

    // Update last sync timestamp
    const { error: syncError } = await supabase
      .from('cloud_provider_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'azure');

    if (syncError) {
      console.error('Error updating last sync timestamp:', syncError);
    }

    console.log('Successfully updated resource counts and sync timestamp');

    return new Response(
      JSON.stringify({ 
        success: true, 
        counts: { vmCount, sqlCount, storageCount },
        usage: { vmUsage, sqlUsage, storageUsage }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in scan-azure-resources function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});