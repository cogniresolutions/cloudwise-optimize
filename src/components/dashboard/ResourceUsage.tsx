import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Database, HardDrive, Loader2, AppWindow, Cloud, BrainCog, Bot, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface ResourceType {
  name: string;
  count: number;
  usage: number;
  icon: React.ElementType;
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
        
        const mappedResources = data.data.map((resource: any) => ({
          name: resource.resource_type,
          count: resource.count,
          usage: resource.usage_percentage,
          icon: getIconForResourceType(resource.resource_type),
        }));
        
        setResources(mappedResources);
        console.log('Successfully updated resources from Azure');
      } else {
        console.log('Using cached data from Supabase');
        const mappedResources = resourceCounts.map((resource) => ({
          name: resource.resource_type,
          count: resource.count,
          usage: resource.usage_percentage,
          icon: getIconForResourceType(resource.resource_type),
        }));
        
        setResources(mappedResources);
      }
    } catch (error) {
      console.error('Error in fetchResourceCounts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch resource counts",
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
        { name: "EC2 Instances", count: 45, usage: 65, icon: Server },
        { name: "RDS Databases", count: 12, usage: 78, icon: Database },
        { name: "EBS Volumes", count: 89, usage: 45, icon: HardDrive },
      ],
      gcp: [
        { name: "Compute Instances", count: 29, usage: 58, icon: Server },
        { name: "Cloud SQL", count: 6, usage: 81, icon: Database },
        { name: "Persistent Disks", count: 42, usage: 48, icon: HardDrive },
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
              const Icon = resource.icon;
              return (
                <div key={resource.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {resource.count} resources
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-primary/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${resource.usage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{resource.usage}%</span>
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
            const Icon = resource.icon;
            return (
              <div key={resource.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {resource.count} resources
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${resource.usage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{resource.usage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}