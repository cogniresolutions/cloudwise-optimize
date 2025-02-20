
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, Database, HardDrive, Loader2, DollarSign,
  CheckCircle, CloudOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface ResourceType {
  resource_type: string;
  count: number;
  usage_percentage: number;
  cost: number | null;
}

interface ResourceUsageProps {
  provider: string;
}

export function ResourceUsage({ provider }: ResourceUsageProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<ResourceType[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const fetchAzureResources = async () => {
    if (!session?.user?.id) {
      console.log("No user session found");
      return;
    }

    setIsLoading(true);
    try {
      // First check if we have valid credentials
      const { data: connections, error: connectionError } = await supabase
        .from('cloud_provider_connections')
        .select('credentials, is_active')
        .eq('user_id', session.user.id)
        .eq('provider', 'azure')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (connectionError) {
        console.error("Error fetching Azure credentials:", connectionError);
        throw new Error("Failed to fetch Azure credentials");
      }

      const connectionData = connections?.[0];
      if (!connectionData?.credentials || !connectionData.is_active) {
        console.log("No active Azure credentials found");
        setIsConnected(false);
        return;
      }

      console.log("Sending credentials shape:", Object.keys(connectionData.credentials));

      // Call the edge function with proper headers
      const { data: resourceData, error: resourceError } = await supabase.functions.invoke(
        'fetch-azure-resource-counts',
        {
          body: {
            credentials: connectionData.credentials
          },
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Response from edge function:", resourceData, resourceError);

      if (resourceError) {
        console.error("Error fetching Azure resources:", resourceError);
        throw resourceError;
      }

      if (!resourceData || !Array.isArray(resourceData)) {
        console.error("Invalid resource data received:", resourceData);
        throw new Error("Invalid resource data received");
      }

      setResources(resourceData);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching Azure resources:", error);
      setIsConnected(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch Azure resources",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && provider === 'azure') {
      fetchAzureResources();
    }
  }, [session?.user, provider]);

  return (
    <Card className="p-6 shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{provider.toUpperCase()} Resource Usage</CardTitle>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isConnected ? (
            <span className="text-green-500 flex items-center">
              <CheckCircle className="h-5 w-5 mr-1" /> Connected
            </span>
          ) : (
            <span className="text-red-500 flex items-center">
              <CloudOff className="h-5 w-5 mr-1" /> Not Connected
            </span>
          )}
        </div>
      </CardHeader>
      {isConnected && (
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4 text-lg">Resource Type</TableHead>
                  <TableHead className="w-1/4 text-lg text-center">Count</TableHead>
                  <TableHead className="w-1/4 text-lg text-center">Usage %</TableHead>
                  <TableHead className="w-1/4 text-lg text-center">Cost (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.resource_type} className="hover:bg-gray-50">
                    <TableCell className="font-medium flex items-center space-x-2 text-base">
                      {getIconForResourceType(resource.resource_type)}
                      <span>{resource.resource_type}</span>
                    </TableCell>
                    <TableCell className="text-base text-center">{resource.count}</TableCell>
                    <TableCell className="text-base text-center">{resource.usage_percentage}%</TableCell>
                    <TableCell className="text-base text-center">
                      {resource.cost !== null ? (
                        <div className="flex items-center justify-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" /> {resource.cost.toFixed(2)}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function getIconForResourceType(type: string) {
  switch (type.toLowerCase()) {
    case 'virtual machines': return <Server className="h-6 w-6 text-primary" />;
    case 'sql databases': return <Database className="h-6 w-6 text-purple-500" />;
    case 'storage accounts': return <HardDrive className="h-6 w-6 text-orange-500" />;
    default: return <Server className="h-6 w-6 text-primary" />;
  }
}
