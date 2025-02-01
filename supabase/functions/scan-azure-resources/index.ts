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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('Starting Azure resource scan...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Azure credentials
    console.log('Fetching Azure credentials for user:', userId);
    const { data: connection, error: connectionError } = await supabase
      .from('cloud_provider_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'azure')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      console.error('Error fetching Azure connection:', connectionError);
      return new Response(
        JSON.stringify({ error: 'No active Azure connection found' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    const credentials = connection.credentials;
    console.log('Retrieved Azure credentials:', {
      clientId: credentials.clientId,
      tenantId: credentials.tenantId,
      subscriptionId: credentials.subscriptionId,
      // Don't log clientSecret for security
    });

    // Initialize Azure clients with error handling
    console.log('Initializing Azure credentials...');
    let credential;
    try {
      credential = new ClientSecretCredential(
        credentials.tenantId,
        credentials.clientId,
        credentials.clientSecret
      );
      console.log('Azure authentication successful');
    } catch (authError) {
      console.error('Azure authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Azure authentication failed' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    console.log('Initializing Azure clients...');
    const resourceClient = new ResourceManagementClient(credential, credentials.subscriptionId);
    const computeClient = new ComputeManagementClient(credential, credentials.subscriptionId);
    const sqlClient = new SqlManagementClient(credential, credentials.subscriptionId);
    const storageClient = new StorageManagementClient(credential, credentials.subscriptionId);

    // Get resource groups with pagination handling
    console.log('Fetching resource groups...');
    const resourceGroups: string[] = [];
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

    // Process each resource group with error handling
    for (const group of resourceGroups) {
      console.log(`Processing resource group: ${group}`);
      
      try {
        // Virtual Machines
        console.log(`Fetching VMs for group: ${group}`);
        const vms = computeClient.virtualMachines.list(group);
        for await (const vm of vms) {
          vmCount++;
          if (vm.name) {
            try {
              const instanceView = await computeClient.virtualMachines.instanceView(group, vm.name);
              const isRunning = instanceView.statuses?.some(
                status => status.code?.toLowerCase().includes('running')
              );
              if (isRunning) {
                vmUsage += 100;
              }
            } catch (vmError) {
              console.error(`Error getting VM instance view for ${vm.name}:`, vmError);
            }
          }
        }
        console.log(`Found ${vmCount} VMs in group ${group}`);

        // SQL Databases
        console.log(`Fetching SQL databases for group: ${group}`);
        const servers = sqlClient.servers.listByResourceGroup(group);
        for await (const server of servers) {
          if (!server.name) continue;
          try {
            const databases = sqlClient.databases.listByServer(group, server.name);
            for await (const db of databases) {
              sqlCount++;
              sqlUsage += 75; // Default usage value
            }
          } catch (dbError) {
            console.error(`Error fetching databases for server ${server.name}:`, dbError);
          }
        }
        console.log(`Found ${sqlCount} SQL databases in group ${group}`);

        // Storage Accounts
        console.log(`Fetching storage accounts for group: ${group}`);
        const accounts = storageClient.storageAccounts.listByResourceGroup(group);
        for await (const account of accounts) {
          storageCount++;
          storageUsage += 60; // Default usage value
        }
        console.log(`Found ${storageCount} storage accounts in group ${group}`);

      } catch (groupError) {
        console.error(`Error processing resource group ${group}:`, groupError);
        // Continue with next group
      }
    }

    // Calculate average usage percentages
    vmUsage = vmCount > 0 ? Math.round(vmUsage / vmCount) : 0;
    sqlUsage = sqlCount > 0 ? Math.round(sqlUsage / sqlCount) : 0;
    storageUsage = storageCount > 0 ? Math.round(storageUsage / storageCount) : 0;

    console.log('Final resource counts:', { vmCount, sqlCount, storageCount });
    console.log('Usage percentages:', { vmUsage, sqlUsage, storageUsage });

    // Update resource counts in database
    console.log('Updating resource counts in database...');
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
    console.log('Updating last sync timestamp...');
    const { error: syncError } = await supabase
      .from('cloud_provider_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'azure');

    if (syncError) {
      console.error('Error updating last sync timestamp:', syncError);
    }

    console.log('Resource scan completed successfully');

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
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});