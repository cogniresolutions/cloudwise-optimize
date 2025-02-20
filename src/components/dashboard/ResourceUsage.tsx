import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, Database, HardDrive, Cloud, Cpu,
  BrainCog, Bot, LayoutGrid, Loader2, DollarSign,
  CheckCircle, CloudOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { ClientSecretCredential } from "@azure/identity";
import { ComputeManagementClient } from "@azure/arm-compute";
import { StorageManagementClient } from "@azure/arm-storage";
import { SqlManagementClient } from "@azure/arm-sql";
import { ConsumptionManagementClient } from "@azure/arm-consumption";

interface ResourceType {
  resource_type: string;
  count: number;
  usage_percentage: number;
  cost: number | null;
}

interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
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
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const { data: connectionData, error: connectionError } = await supabase
        .from('cloud_provider_connections')
        .select('credentials')
        .eq('user_id', session.user.id)
        .eq('provider', 'azure')
        .eq('is_active', true)
        .single();

      if (connectionError || !connectionData?.credentials) {
        throw new Error("No valid Azure credentials found");
      }

      const credentials = connectionData.credentials as { [key: string]: any };
      if (!credentials.tenantId || !credentials.clientId || 
          !credentials.clientSecret || !credentials.subscriptionId) {
        throw new Error("Invalid Azure credentials format");
      }

      const azureCredentials: AzureCredentials = {
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        subscriptionId: credentials.subscriptionId
      };
      
      const credential = new ClientSecretCredential(
        azureCredentials.tenantId,
        azureCredentials.clientId,
        azureCredentials.clientSecret
      );

      const computeClient = new ComputeManagementClient(credential, azureCredentials.subscriptionId);
      const storageClient = new StorageManagementClient(credential, azureCredentials.subscriptionId);
      const sqlClient = new SqlManagementClient(credential, azureCredentials.subscriptionId);
      const consumptionClient = new ConsumptionManagementClient(credential, azureCredentials.subscriptionId);

      const vms = [];
      for await (const vm of computeClient.virtualMachines.listAll()) {
        vms.push(vm);
      }

      const storageAccounts = [];
      for await (const account of storageClient.storageAccounts.list()) {
        storageAccounts.push(account);
      }

      const sqlServers = [];
      for await (const server of sqlClient.servers.list()) {
        sqlServers.push(server);
      }

      const usageDetails = [];
      for await (const usage of consumptionClient.usageDetails.list(azureCredentials.subscriptionId, {
        expand: 'properties'
      })) {
        usageDetails.push(usage);
      }

      const getResourceCost = (resourceType: string) => {
        const usage = usageDetails.find(
          (item: any) => item.instanceName?.toLowerCase().includes(resourceType.toLowerCase())
        );
        return usage?.pretaxCost ? parseFloat(usage.pretaxCost) : 0;
      };

      const newResources: ResourceType[] = [
        {
          resource_type: "Virtual Machines",
          count: vms.length,
          usage_percentage: 70,
          cost: getResourceCost("virtualMachines"),
        },
        {
          resource_type: "Storage Accounts",
          count: storageAccounts.length,
          usage_percentage: 50,
          cost: getResourceCost("storageAccounts"),
        },
        {
          resource_type: "SQL Databases",
          count: sqlServers.length,
          usage_percentage: 40,
          cost: getResourceCost("sqlDatabases"),
        },
      ];

      setResources(newResources);
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
