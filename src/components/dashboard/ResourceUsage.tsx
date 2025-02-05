import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, Database, HardDrive, Cloud, Cpu,
  BrainCog, Bot, LayoutGrid, Loader2, DollarSign,
  CheckCircle, CloudOff, ChevronDown, ChevronUp, Lightbulb,
  TrendingDown, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface ResourceType {
  resource_type: string;
  count: number;
  usage_percentage: number;
  cost: number | null;
  recommendations?: string;
  potential_savings?: number;
  optimization_priority?: 'high' | 'medium' | 'low';
  action_items?: string[];
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

  const generateOptimizationRecommendations = async (resources: ResourceType[]) => {
    return Promise.all(resources.map(async (resource) => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-cost-recommendations', {
          body: { 
            resource,
            provider,
            usage_percentage: resource.usage_percentage,
            cost: resource.cost
          }
        });

        if (error) throw error;

        return { 
          ...resource, 
          recommendations: data.recommendation,
          potential_savings: data.potential_savings,
          optimization_priority: data.priority,
          action_items: data.action_items || []
        };
      } catch (error) {
        console.error('Error generating recommendations:', error);
        return { 
          ...resource, 
          recommendations: "Unable to generate recommendations at this time.",
          potential_savings: 0,
          optimization_priority: 'low',
          action_items: []
        };
      }
    }));
  };

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

      const resourcesWithRecommendations = await generateOptimizationRecommendations(resourceCounts);
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

  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

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
                <React.Fragment key={resource.resource_type}>
                  <TableRow>
                    <TableCell className="font-medium flex items-center">
                      {getIconForResourceType(resource.resource_type)}
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
                      <button onClick={() => toggleRow(resource.resource_type)}>
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
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">Resource Optimization Details</h4>
                            <span className={`flex items-center ${getPriorityColor(resource.optimization_priority)}`}>
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Priority: {resource.optimization_priority || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center text-yellow-500 mb-3">
                              <Lightbulb className="h-5 w-5 mr-2" />
                              <p className="font-semibold">Optimization Recommendations</p>
                            </div>
                            <p className="text-gray-700 mb-4">{resource.recommendations}</p>
                            
                            {resource.potential_savings && resource.potential_savings > 0 && (
                              <div className="flex items-center text-green-600 mb-3">
                                <TrendingDown className="h-5 w-5 mr-2" />
                                <p>
                                  <span className="font-semibold">Potential Monthly Savings: </span>
                                  ${resource.potential_savings.toFixed(2)}
                                </p>
                              </div>
                            )}
                            
                            {resource.action_items && resource.action_items.length > 0 && (
                              <div className="mt-4">
                                <p className="font-semibold mb-2">Recommended Actions:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {resource.action_items.map((action, index) => (
                                    <li key={index} className="text-gray-700">{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function getIconForResourceType(type: string) {
  switch (type.toLowerCase()) {
    case 'virtual machines': return <Server className="h-5 w-5 text-primary" />;
    case 'sql databases': return <Database className="h-5 w-5 text-primary" />;
    case 'storage accounts': return <HardDrive className="h-5 w-5 text-primary" />;
    case 'app services': return <Cloud className="h-5 w-5 text-primary" />;
    case 'kubernetes clusters': return <Cpu className="h-5 w-5 text-primary" />;
    case 'cognitive services': return <BrainCog className="h-5 w-5 text-primary" />;
    case 'azure openai': return <Bot className="h-5 w-5 text-primary" />;
    case 'container apps': return <LayoutGrid className="h-5 w-5 text-primary" />;
    default: return <Server className="h-5 w-5 text-primary" />;
  }
}
