
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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

    // For now, return mock data to test the frontend integration
    const mockResourceData = [
      {
        resource_type: "Virtual Machines",
        count: 5,
        usage_percentage: 75,
        cost: 450.50
      },
      {
        resource_type: "Storage Accounts",
        count: 3,
        usage_percentage: 45,
        cost: 120.25
      },
      {
        resource_type: "SQL Databases",
        count: 2,
        usage_percentage: 60,
        cost: 300.75
      }
    ];

    console.log("Returning mock data for testing");
    return new Response(
      JSON.stringify(mockResourceData),
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
