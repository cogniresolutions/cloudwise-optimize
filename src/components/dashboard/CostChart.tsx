import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2 } from "lucide-react";

interface CostData {
  month: string;
  cost: number;
  savings: number;
}

export function CostChart() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [costData, setCostData] = useState<CostData[]>([]);

  const fetchCostData = async () => {
    try {
      const { data: resources, error } = await supabase
        .from('cloud_resources')
        .select('cost_data, last_updated_at')
        .eq('user_id', session?.user.id)
        .eq('resource_type', 'cost')
        .order('last_updated_at', { ascending: true });

      if (error) throw error;

      // Process and transform the cost data
      const processedData = resources.reduce((acc: CostData[], resource) => {
        if (resource.cost_data && resource.cost_data.properties) {
          const month = new Date(resource.last_updated_at).toLocaleString('default', { month: 'short' });
          const cost = parseFloat(resource.cost_data.properties.totalCost || 0);
          const savings = parseFloat(resource.cost_data.properties.potentialSavings || 0);

          // Check if we already have an entry for this month
          const existingEntry = acc.find(entry => entry.month === month);
          if (existingEntry) {
            existingEntry.cost += cost;
            existingEntry.savings += savings;
          } else {
            acc.push({ month, cost, savings });
          }
        }
        return acc;
      }, []);

      setCostData(processedData);
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchCostData();
    }
  }, [session?.user]);

  if (isLoading) {
    return (
      <Card className="col-span-4 animate-fade-in">
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cost Overview</CardTitle>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-primary/30 mr-1" />
            Costs
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-secondary/30 mr-1" />
            Potential Savings
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorCost)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="hsl(var(--secondary))"
                fillOpacity={1}
                fill="url(#colorSavings)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}