import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { ResourceStatusIndicator } from "./ResourceStatusIndicator";
import { ResourceTable } from "./ResourceTable";
import { ResourceType } from "./types";

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
      const { data: connections, error: connectionError } = await supabase
        .from('cloud_provider_connections')
        .select('*')
        .eq('provider', 'azure')
        .eq('user_id', session?.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (connectionError || !connections || connections.length === 0) {
        setIsAzureConnected(false);
        localStorage.removeItem('azureConnected');
        return;
      }

      const connection = connections[0];
      const lastSyncTime = connection.last_sync_at ? new Date(connection.last_sync_at).getTime() : 0;
      const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);

      if (lastSyncTime <= oneHourAgo) {
        setIsAzureConnected(false);
        localStorage.removeItem('azureConnected');
        return;
      }

      setIsAzureConnected(true);
      localStorage.setItem('azureConnected', 'true');

      const { data: resourceCounts, error } = await supabase
        .from('azure_resource_counts')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('last_updated_at', { ascending: false });

      if (error) throw error;

      // Generate recommendations for each resource
      const resourcesWithRecommendations = await Promise.all(
        resourceCounts.map(async (resource) => {
          try {
            const { data: recommendation, error: recError } = await supabase.functions.invoke(
              'generate-cost-recommendations',
              {
                body: {
                  resource,
                  provider,
                  usage_percentage: resource.usage_percentage,
                  cost: resource.cost
                }
              }
            );

            if (recError) throw recError;

            return {
              ...resource,
              recommendations: recommendation.recommendation,
              details: `Resource Type: ${resource.resource_type}\nCount: ${resource.count}\nUsage: ${resource.usage_percentage}%\nCost: $${resource.cost}`
            };
          } catch (err) {
            console.error('Error generating recommendations:', err);
            return {
              ...resource,
              recommendations: "Unable to generate recommendations at this time.",
              details: `Resource Type: ${resource.resource_type}\nCount: ${resource.count}\nUsage: ${resource.usage_percentage}%\nCost: $${resource.cost}`
            };
          }
        })
      );

      setResources(resourcesWithRecommendations);
    } catch (err) {
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
    const storedConnectionStatus = localStorage.getItem('azureConnected');
    if (storedConnectionStatus === 'true') {
      setIsAzureConnected(true);
    }
    fetchResourceCounts();
  }, [session?.user, provider]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{provider.toUpperCase()} Resource Usage</CardTitle>
          <ResourceStatusIndicator isLoading={isLoading} isConnected={isAzureConnected} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <ResourceStatusIndicator isLoading={true} isConnected={false} />
          </div>
        ) : (
          <ResourceTable resources={resources} />
        )}
      </CardContent>
    </Card>
  );
}