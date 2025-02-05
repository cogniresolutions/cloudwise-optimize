import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Server, Database, HardDrive, Loader2, Cloud, 
  LayoutGrid, Bot, BrainCog, AppWindow, DollarSign 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface ResourceType {
  resource_type: string;
  count: number;
  usage_percentage: number;
  cost?: number;
}

interface ResourceUsageProps {
  provider: string;
}

export function ResourceUsage({ provider }: ResourceUsageProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<ResourceType[]>([]);

  const getIconForResourceType = (type: string): React.ElementType => {
    switch (type.toLowerCase()) {
      case 'virtual machines':
        return Server;
      case 'sql databases':
      case 'sql servers':
      case 'databases':
      case 'cosmos db':
        return Database;
      case 'storage accounts':
        return HardDrive;
      case 'app services':
        return AppWindow;
      case 'kubernetes clusters':
        return Cloud;
      case 'cognitive services':
        return BrainCog;
      case 'azure openai':
        return Bot;
      case 'container apps':
        return LayoutGrid;
      default:
        return Server;
    }
  };

  const fetchResourceCounts = async () => {
    if (provider !== 'azure') return;
    
    setIsLoading(true);
    try {
      console.log('Fetching Azure resource counts...');
      
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
        const { data, error } = await supabase.functions.invoke('fetch-azure-resource-counts');
        
        if (error) {
          console.error('Error invoking function:', error);
          throw error;
        }

        if (!data?.data) {
          console.error('Invalid response from function:', data);
          throw new Error('Invalid response from server');
        }
        
        setResources(data.data);
        console.log('Successfully updated resources from Azure');
      } else {
        console.log('Using cached data from Supabase');
        setResources(resourceCounts);
      }
    } catch (err) {
      console.error('Error in fetchResourceCounts:', err);
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

  if (provider !== 'azure') {
    // Return mock data for other providers
    const mockData = {
      aws: [
        { resource_type: "EC2 Instances", count: 45, usage_percentage: 65 },
        { resource_type: "RDS Databases", count: 12, usage_percentage: 78 },
        { resource_type: "EBS Volumes", count: 89, usage_percentage: 45 },
      ],
      gcp: [
        { resource_type: "Compute Instances", count: 29, usage_percentage: 58 },
        { resource_type: "Cloud SQL", count: 6, usage_percentage: 81 },
        { resource_type: "Persistent Disks", count: 42, usage_percentage: 48 },
      ],
    };

    return (
      <Card className="col-span-4 animate-fade-in">
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
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
    <Card className="col-span-4 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resource Usage</CardTitle>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
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