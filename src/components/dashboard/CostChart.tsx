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
      // First try to get data from historical_cost_data
      const { data: historicalData, error: historicalError } = await supabase
        .from('historical_cost_data')
        .select('cost_date, total_cost, potential_savings')
        .eq('user_id', session?.user.id)
        .gte('cost_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('cost_date', { ascending: true });

      if (historicalError) throw historicalError;

      // Then get recent data from cloud_resources
      const { data: recentData, error: recentError } = await supabase
        .from('cloud_resources')
        .select('cost_data, last_updated_at')
        .eq('user_id', session?.user.id)
        .eq('resource_type', 'cost')
        .order('last_updated_at', { ascending: true });

      if (recentError) throw recentError;

      // Process historical data
      const processedHistorical = historicalData.reduce((acc: Record<string, CostData>, entry) => {
        const month = new Date(entry.cost_date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = {
            month,
            cost: 0,
            savings: 0
          };
        }
        acc[month].cost += Number(entry.total_cost);
        acc[month].savings += Number(entry.potential_savings);
        return acc;
      }, {});

      // Process recent data
      const processedRecent = recentData.reduce((acc: Record<string, CostData>, resource) => {
        if (resource.cost_data && typeof resource.cost_data === 'object') {
          const month = new Date(resource.last_updated_at).toLocaleString('default', { month: 'short' });
          if (!acc[month]) {
            acc[month] = {
              month,
              cost: 0,
              savings: 0
            };
          }
          // Safely access cost_data properties
          const costData = resource.cost_data as Record<string, any>;
          acc[month].cost += Number(costData.totalCost || 0);
          acc[month].savings += Number(costData.potentialSavings || 0);
        }
        return acc;
      }, processedHistorical);

      // Convert to array and sort by month
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const finalData = Object.values(processedRecent).sort((a, b) => 
        monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      );

      setCostData(finalData);
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