
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { DefaultAzureCredential } from "https://esm.sh/@azure/identity@3.1.3";
import {
  ComputeManagementClient,
  VirtualMachine,
} from "https://esm.sh/@azure/arm-compute@21.0.0";
import {
  StorageManagementClient,
  StorageAccount,
} from "https://esm.sh/@azure/arm-storage@17.2.0";
import {
  SqlManagementClient,
  Server,
} from "https://esm.sh/@azure/arm-sql@9.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Receiving request to fetch Azure resources...");
    const { credentials } = await req.json();

    if (!credentials || !credentials.clientId || !credentials.clientSecret || !credentials.tenantId || !credentials.subscriptionId) {
      console.error("Missing required Azure credentials");
      return new Response(
        JSON.stringify({ error: "Missing required Azure credentials" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Creating Azure clients...");
    const creds = {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      tenantId: credentials.tenantId
    };

    const computeClient = new ComputeManagementClient(creds, credentials.subscriptionId);
    const storageClient = new StorageManagementClient(creds, credentials.subscriptionId);
    const sqlClient = new SqlManagementClient(creds, credentials.subscriptionId);

    console.log("Fetching Azure resources...");

    // Fetch all VMs
    const vms = await computeClient.virtualMachines.listAll();
    const vmCount = Array.from(await vms.byPage()).flat().length;
    console.log(`Found ${vmCount} VMs`);

    // Fetch all storage accounts
    const storageAccounts = await storageClient.storageAccounts.list();
    const storageCount = Array.from(await storageAccounts.byPage()).flat().length;
    console.log(`Found ${storageCount} storage accounts`);

    // Fetch all SQL databases
    const sqlServers = await sqlClient.servers.list();
    const sqlCount = Array.from(await sqlServers.byPage()).flat().length;
    console.log(`Found ${sqlCount} SQL servers`);

    const resourceData = [
      {
        resource_type: "Virtual Machines",
        count: vmCount,
        usage_percentage: Math.round(Math.random() * 100), // Mock usage data
        cost: Number((Math.random() * 1000).toFixed(2)) // Mock cost data
      },
      {
        resource_type: "Storage Accounts",
        count: storageCount,
        usage_percentage: Math.round(Math.random() * 100),
        cost: Number((Math.random() * 500).toFixed(2))
      },
      {
        resource_type: "SQL Databases",
        count: sqlCount,
        usage_percentage: Math.round(Math.random() * 100),
        cost: Number((Math.random() * 800).toFixed(2))
      }
    ];

    console.log("Successfully fetched all Azure resources");
    return new Response(
      JSON.stringify(resourceData),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in fetch-azure-resource-counts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
