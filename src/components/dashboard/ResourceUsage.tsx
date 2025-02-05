import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Server, Database, HardDrive, Cloud, Cpu,
  LayoutGrid, Bot, BrainCog, Loader2, DollarSign,
  LogOut, CheckCircle, CloudOff
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

  const fetchResourceCounts = async () => {
    if (provider !== 'azure') return;
    
    setIsLoading(true);
    try {
      console.log('Fetching Azure resource counts for user:', session?.user.id);
      
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
          setIsAzureConnected(false);
          throw functionError;
        }

        if (!newData?.data) {
          console.error('Invalid response from function:', newData);
          setIsAzureConnected(false);
          throw new Error('Invalid response from server');
        }
        
        setResources(newData.data);
        setIsAzureConnected(true);
        console.log('Successfully updated resources from Azure');
      } else {
        console.log('Using cached data from Supabase');
        setResources(resourceCounts);
        setIsAzureConnected(true);
      }
    } catch (err) {
      console.error('Error in fetchResourceCounts:', err);
      setIsAzureConnected(false);
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
      fetchResourceCounts();
    }
  }, [session?.user, provider]);

  // Set up real-time subscription for resource count updates
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

  const disconnectAzure = () => {
    setIsAzureConnected(false);
    setResources([]);
    toast({ 
      title: "Azure Disconnected", 
      description: "Successfully disconnected from Azure." 
    });
  };

  if (provider !== 'azure') {
    // Return mock data for other providers
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
          <div className="flex items-center">
            <CardTitle>Azure Resource Usage</CardTitle>
            {isAzureConnected ? (
              <span className="ml-4 text-green-500 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Connected
              </span>
            ) : (
              <span className="ml-4 text-red-500 flex items-center">
                <CloudOff className="w-4 h-4 mr-1" /> Not Connected
              </span>
            )}
          </div>
          {isAzureConnected && (
            <button 
              onClick={disconnectAzure} 
              className="flex items-center text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" /> Disconnect
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => {
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
                      {resource.cost !== null && (
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
        )}
      </CardContent>
    </Card>
  );
}

function getIconForResourceType(type: string) {
  switch (type.toLowerCase()) {
    case 'virtual machines':
    case 'ec2 instances':
    case 'compute instances':
      return Server;
    case 'sql databases':
    case 'sql servers':
    case 'cosmos db':
    case 'rds databases':
    case 'cloud sql':
      return Database;
    case 'storage accounts':
    case 'ebs volumes':
    case 'persistent disks':
      return HardDrive;
    case 'app services':
      return Cloud;
    case 'kubernetes clusters':
      return Cpu;
    case 'cognitive services':
      return BrainCog;
    case 'azure openai':
      return Bot;
    case 'container apps':
      return LayoutGrid;
    default:
      return Server;
  }
}