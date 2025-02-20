
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
    
    // Get the raw body text first
    const bodyText = await req.text();
    
    if (!bodyText) {
      console.error("Empty request body received");
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log("Received body text:", bodyText);

    // Try to parse the JSON
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log("Successfully parsed body:", Object.keys(body));
    } catch (e) {
      console.error("Error parsing request JSON:", e, "Body was:", bodyText);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body",
          receivedText: bodyText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Extract and validate credentials
    const { credentials } = body;
    if (!credentials) {
      console.error("No credentials provided in body:", body);
      return new Response(
        JSON.stringify({ 
          error: "No credentials provided",
          receivedBody: body
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const requiredFields = ['clientId', 'clientSecret', 'tenantId', 'subscriptionId'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error("Missing required Azure credentials fields:", missingFields);
      return new Response(
        JSON.stringify({ 
          error: "Missing required Azure credentials",
          missingFields,
          receivedFields: Object.keys(credentials)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Return mock data for now
    console.log("All credentials validated, returning mock data");
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
