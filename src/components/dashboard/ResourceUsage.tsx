import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Database, HardDrive, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

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
  const [resources, setResources] = useState<ResourceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchResourceCounts = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching resource counts for provider:", provider, "user:", user?.id);
        
        if (provider === 'azure' && user) {
          const { data, error } = await supabase
            .from('azure_resource_counts')
            .select('*')
            .eq('user_id', user.id);

          console.log("Azure resource counts response:", { data, error });

          if (error) {
            throw error;
          }

          if (data) {
            const resourceMap: { [key: string]: ResourceType } = {
              'Virtual Machines': { name: 'Virtual Machines', count: 0, usage: 72, icon: Server },
              'SQL Databases': { name: 'SQL Databases', count: 0, usage: 85, icon: Database },
              'Storage Accounts': { name: 'Storage Accounts', count: 0, usage: 52, icon: HardDrive },
            };

            // Update counts from database
            data.forEach(item => {
              if (resourceMap[item.resource_type]) {
                resourceMap[item.resource_type].count = item.count;
                if (item.usage_percentage !== null) {
                  resourceMap[item.resource_type].usage = item.usage_percentage;
                }
              }
            });

            setResources(Object.values(resourceMap));
          }
        } else {
          // Default data for other providers
          const defaultData: { [key: string]: ResourceType[] } = {
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

          setResources(defaultData[provider] || []);
        }
      } catch (error: any) {
        console.error('Error fetching resource counts:', error);
        toast({
          title: "Error fetching resources",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceCounts();

    // Subscribe to real-time updates for Azure resources
    if (provider === 'azure' && user) {
      const channel = supabase
        .channel('azure-resources')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'azure_resource_counts',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Received real-time update:', payload);
            fetchResourceCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [provider, user, toast]);

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
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