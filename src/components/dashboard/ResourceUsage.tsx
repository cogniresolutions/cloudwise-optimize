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
  const [isExpanded, setIsExpanded] = useState(true);

  const checkConnectionStatus = async () => {
    try {
      const { data: connections, error: connectionError } = await supabase
        .from('cloud_provider_connections')
        .select('*')
        .eq('provider', provider)
        .eq('user_id', session?.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (connectionError || !connections || connections.length === 0) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    } catch (err) {
      setIsConnected(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to check ${provider} connection status`,
      });
    }
  };

  const fetchResourceCounts = async () => {
    setIsLoading(true);
    try {
      await checkConnectionStatus();

      if (!isConnected) return;

      let data;
      let error;

      // Type-safe way to handle different resource tables
      if (provider.toLowerCase() === 'azure') {
        const result = await supabase
          .from('azure_resource_counts')
          .select('*')
          .eq('user_id', session?.user.id)
          .order('last_updated_at', { ascending: false });
          
        data = result.data;
        error = result.error;
      } else if (provider.toLowerCase() === 'aws') {
        const result = await supabase
          .from('azure_resource_counts') // Using azure table for demo, update when AWS table is ready
          .select('*')
          .eq('user_id', session?.user.id)
          .order('last_updated_at', { ascending: false });
          
        data = result.data;
        error = result.error;
      } else if (provider.toLowerCase() === 'gcp') {
        const result = await supabase
          .from('azure_resource_counts') // Using azure table for demo, update when GCP table is ready
          .select('*')
          .eq('user_id', session?.user.id)
          .order('last_updated_at', { ascending: false });
          
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw error;
      }

      if (data) {
        // Explicitly map the data to match ResourceType
        const typedResources: ResourceType[] = data.map(item => ({
          resource_type: item.resource_type,
          count: item.count,
          usage_percentage: item.usage_percentage || 0,
          cost: item.cost
        }));
        
        setResources(typedResources);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to fetch ${provider} resource counts`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchResourceCounts();
    }
  }, [session?.user, provider]);

  return (
    <Card className="p-6 shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
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
      {isConnected && isExpanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
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
          )}
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
    case 'app services': return <Cloud className="h-6 w-6 text-green-500" />;
    case 'kubernetes clusters': return <Cpu className="h-6 w-6 text-red-500" />;
    case 'cosmos db': return <Database className="h-6 w-6 text-gray-500" />;
    case 'cognitive services': return <BrainCog className="h-6 w-6 text-blue-500" />;
    case 'azure openai': return <Bot className="h-6 w-6 text-teal-500" />;
    case 'container apps': return <LayoutGrid className="h-6 w-6 text-indigo-500" />;
    default: return <Server className="h-6 w-6 text-primary" />;
  }
}