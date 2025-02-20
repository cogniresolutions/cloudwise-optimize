
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
    
    // Check if we have a request body
    const contentLength = req.headers.get('content-length');
    if (!contentLength || parseInt(contentLength) === 0) {
      console.error("Empty request body");
      return new Response(
        JSON.stringify({ error: "Request body is empty" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get the raw body text first
    const bodyText = await req.text();
    console.log("Received body text:", bodyText);

    // Try to parse the JSON
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          receivedBody: bodyText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Extract credentials
    const { credentials } = body;
    console.log("Extracted credentials object:", JSON.stringify(credentials, null, 2));

    if (!credentials || !credentials.clientId || !credentials.clientSecret || !credentials.tenantId || !credentials.subscriptionId) {
      console.error("Missing required Azure credentials");
      return new Response(
        JSON.stringify({ 
          error: "Missing required Azure credentials",
          receivedCredentials: credentials ? Object.keys(credentials) : null
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Credentials validated, returning mock data for testing");
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
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
