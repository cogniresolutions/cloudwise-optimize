import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, Database, HardDrive, Cloud, Cpu,
  BrainCog, Bot, LayoutGrid, Loader2, DollarSign,
  CheckCircle, CloudOff, ChevronDown, ChevronUp, Lightbulb
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
}

interface ResourceUsageProps {
  provider: string;
}

export default function ResourceUsage({ provider }: ResourceUsageProps) {
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

      if (error) {
        throw error;
      }

      const resourcesWithRecommendations = resourceCounts.map(resource => ({
        ...resource,
        recommendations: generateOptimizationRecommendations(resource)
      }));

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

  const generateOptimizationRecommendations = (resource: ResourceType) => {
    if (resource.resource_type.toLowerCase() === 'azure openai') {
      const { usage_percentage, cost } = resource;
      
      // High usage recommendations
      if (usage_percentage > 80) {
        return `High usage detected (${usage_percentage}%). Consider: 
          1. Implementing token quotas per endpoint
          2. Using model compression techniques
          3. Implementing caching for common requests
          4. Evaluating cheaper model alternatives for non-critical tasks`;
      } 
      // Low usage recommendations
      else if (usage_percentage < 20) {
        return `Low usage detected (${usage_percentage}%). Consider: 
          1. Consolidating endpoints to reduce costs
          2. Implementing auto-scaling
          3. Reviewing and optimizing prompt lengths
          4. Analyzing usage patterns to optimize deployment times`;
      }
      // Cost-based recommendations
      else if (cost && cost > 1000) {
        return `High costs detected ($${cost.toFixed(2)}). Consider: 
          1. Implementing rate limiting
          2. Using fine-tuned models for specific tasks
          3. Monitoring and optimizing token usage
          4. Setting up cost alerts and budgets`;
      }
      // Optimal usage
      else {
        return `Usage is optimal (${usage_percentage}%). Recommendations: 
          1. Continue monitoring usage patterns
          2. Set up alerts for usage spikes
          3. Document current optimization practices
          4. Regular cost-benefit analysis of model selection`;
      }
    }
    
    // Default recommendations for other resource types
    return "No specific recommendations for this resource type. Monitor usage and costs regularly.";
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
                        <p><strong>Resource Details:</strong></p>
                        <p>Usage History and Cost Breakdown will appear here...</p>
                        <div className="flex items-center text-yellow-500 mt-2">
                          <Lightbulb className="h-5 w-5 mr-2" />
                          <div>
                            <p><strong>Optimization Tips:</strong></p>
                            <p className="whitespace-pre-line">{resource.recommendations}</p>
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
