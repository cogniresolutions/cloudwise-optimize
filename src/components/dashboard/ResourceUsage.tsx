import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, Database, HardDrive, Cloud, Cpu,
  BrainCog, Bot, LayoutGrid, Loader2, DollarSign,
  CheckCircle, CloudOff, ChevronDown, ChevronUp
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
  const [isAzureConnected, setIsAzureConnected] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (resourceType: string) => {
    setExpandedRows((prev) =>
      prev.includes(resourceType) ? prev.filter((r) => r !== resourceType) : [...prev, resourceType]
    );
  };

  const fetchResourceCounts = async () => {
    if (provider !== 'azure') return;
    
    setIsLoading(true);
    try {
      console.log('Fetching Azure resource counts for user:', session?.user.id);
      
      const { data: connections, error: connectionError } = await supabase
        .from('cloud_provider_connections')
        .select('*')
        .eq('provider', 'azure')
        .eq('user_id', session?.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (connectionError) {
        console.error('Error fetching Azure connections:', connectionError);
        setIsAzureConnected(false);
        localStorage.removeItem('azureConnected');
        return;
      }

      if (!connections || connections.length === 0) {
        console.log('No active Azure connection found');
        setIsAzureConnected(false);
        localStorage.removeItem('azureConnected');
        return;
      }

      const connection = connections[0];
      const lastSyncTime = connection.last_sync_at ? new Date(connection.last_sync_at).getTime() : 0;
      const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);

      if (lastSyncTime <= oneHourAgo) {
        console.log('Azure connection is stale');
        setIsAzureConnected(false);
        localStorage.removeItem('azureConnected');
        return;
      }

      setIsAzureConnected(true);
      localStorage.setItem('azureConnected', 'true');
      localStorage.setItem('azureLastSync', lastSyncTime.toString());

      const { data: resourceCounts, error } = await supabase
        .from('azure_resource_counts')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('last_updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching from Supabase:', error);
        throw error;
      }

      const isStale = !resourceCounts?.length || 
        new Date().getTime() - new Date(resourceCounts[0].last_updated_at).getTime() > 5 * 60 * 1000;

      if (isStale) {
        console.log('Data is stale, fetching from Azure...');
        const { data: newData, error: functionError } = await supabase.functions.invoke('fetch-azure-resource-counts');
        
        if (functionError) {
          console.error('Error invoking function:', functionError);
          throw functionError;
        }

        if (!newData?.data) {
          console.error('Invalid response from function:', newData);
          throw new Error('Invalid response from server');
        }
        
        setResources(newData.data);
        console.log('Successfully updated resources from Azure');
      } else {
        console.log('Using cached data from Supabase');
        setResources(resourceCounts);
      }
    } catch (err) {
      console.error('Error in fetchResourceCounts:', err);
      setIsAzureConnected(false);
      localStorage.removeItem('azureConnected');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch resource counts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && provider === 'azure') {
      const storedConnectionStatus = localStorage.getItem('azureConnected');
      const storedLastSync = localStorage.getItem('azureLastSync');
      
      if (storedConnectionStatus === 'true' && storedLastSync) {
        const lastSyncTime = parseInt(storedLastSync);
        const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
        
        if (lastSyncTime > oneHourAgo) {
          setIsAzureConnected(true);
          fetchResourceCounts();
        } else {
          localStorage.removeItem('azureConnected');
          localStorage.removeItem('azureLastSync');
        }
      }
    }
  }, [session?.user, provider]);

  useEffect(() => {
    if (!session?.user || provider !== 'azure') return;

    const channel = supabase
      .channel('azure-resource-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'azure_resource_counts',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Resource count updated:', payload);
          fetchResourceCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user, provider]);

  if (provider !== 'azure') {
    const mockData = {
      aws: [
        { resource_type: "EC2 Instances", count: 45, usage_percentage: 65, cost: 1234.56 },
        { resource_type: "RDS Databases", count: 12, usage_percentage: 78, cost: 567.89 },
        { resource_type: "EBS Volumes", count: 89, usage_percentage: 45, cost: 123.45 },
      ],
      gcp: [
        { resource_type: "Compute Instances", count: 29, usage_percentage: 58, cost: 987.65 },
        { resource_type: "Cloud SQL", count: 6, usage_percentage: 81, cost: 432.10 },
        { resource_type: "Persistent Disks", count: 42, usage_percentage: 48, cost: 234.56 },
      ],
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData[provider as keyof typeof mockData].map((resource) => {
              const Icon = getIconForResourceType(resource.resource_type);
              return (
                <div key={resource.resource_type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{resource.resource_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {resource.count} resources
                      </p>
                      {resource.cost !== undefined && (
                        <p className="flex items-center text-sm text-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {resource.cost.toFixed(2)} USD
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-primary/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${resource.usage_percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{resource.usage_percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{provider.toUpperCase()} Resource Usage</CardTitle>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAzureConnected ? (
            <span className="text-green-500 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" /> Connected
            </span>
          ) : (
            <span className="text-red-500 flex items-center">
              <CloudOff className="h-4 w-4 mr-1" /> Not Connected
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource Type</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Usage %</TableHead>
                <TableHead>Cost (USD)</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <>
                  <TableRow key={resource.resource_type}>
                    <TableCell className="font-medium flex items-center">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {getIconForResourceType(resource.resource_type)}
                      </div>
                      <span className="ml-2">{resource.resource_type}</span>
                    </TableCell>
                    <TableCell>{resource.count}</TableCell>
                    <TableCell>{resource.usage_percentage}%</TableCell>
                    <TableCell>
                      {resource.cost !== null ? (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" /> {resource.cost.toFixed(2)}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => toggleRow(resource.resource_type)}
                        className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                      >
                        {expandedRows.includes(resource.resource_type) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(resource.resource_type) && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-gray-50 p-4">
                        <div className="space-y-2">
                          <p className="font-medium">Resource Details:</p>
                          <p className="text-sm text-muted-foreground">
                            Usage History and Cost Breakdown will appear here...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function getIconForResourceType(type: string) {
  const iconProps = { className: "h-5 w-5 text-primary" };
  
  switch (type.toLowerCase()) {
    case 'virtual machines':
      return <Server {...iconProps} />;
    case 'sql databases':
      return <Database {...iconProps} />;
    case 'storage accounts':
      return <HardDrive {...iconProps} />;
    case 'app services':
      return <Cloud {...iconProps} />;
    case 'kubernetes clusters':
      return <Cpu {...iconProps} />;
    case 'cognitive services':
      return <BrainCog {...iconProps} />;
    case 'azure openai':
      return <Bot {...iconProps} />;
    case 'container apps':
      return <LayoutGrid {...iconProps} />;
    default:
      return <Server {...iconProps} />;
  }
}
