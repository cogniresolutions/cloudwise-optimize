import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Server, 
  Database, 
  HardDrive, 
  Cloud, 
  Cpu, 
  BrainCog, 
  Bot, 
  LayoutGrid,
  type LucideIcon 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ResourceCount = {
  resource_type: string;
  count: number;
  usage_percentage: number;
  cost: number;
};

export default function ResourceUsage() {
  const [resourceCounts, setResourceCounts] = useState<ResourceCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchResourceCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('resource_type, count, usage_percentage, cost');

      if (error) throw error;

      setResourceCounts(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching resources",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResourceCounts();
  }, []);

  const getIconForResourceType = (type: string): LucideIcon => {
    switch (type.toLowerCase()) {
      case 'virtual machines':
        return Server;
      case 'sql databases':
        return Database;
      case 'storage accounts':
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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Azure Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource Type</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resourceCounts.map((resource) => {
              const Icon = getIconForResourceType(resource.resource_type);
              return (
                <TableRow key={resource.resource_type}>
                  <TableCell className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {resource.resource_type}
                  </TableCell>
                  <TableCell>{resource.count}</TableCell>
                  <TableCell>{resource.usage_percentage}%</TableCell>
                  <TableCell>${resource.cost.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
