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

interface HistoricalCostData {
  cost_date: string;
  total_cost: number;
  potential_savings: number;
}

interface CloudResourceCostData {
  last_updated_at: string;
  cost_data: {
    totalCost?: number;
    potentialSavings?: number;
  };
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
        .gte('cost_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) as { data: HistoricalCostData[] | null, error: any };

      if (historicalError) throw historicalError;

      // Then get recent data from cloud_resources
      const { data: recentData, error: recentError } = await supabase
        .from('cloud_resources')
        .select('cost_data, last_updated_at')
        .eq('user_id', session?.user.id)
        .eq('resource_type', 'cost')
        .order('last_updated_at', { ascending: true }) as { data: CloudResourceCostData[] | null, error: any };

      if (recentError) throw recentError;

      // Process historical data
      const processedHistorical = (historicalData || []).reduce((acc: Record<string, CostData>, entry) => {
        const month = new Date(entry.cost_date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = {
            month,
            cost: 0,
            savings: 0
          };
        }
        acc[month].cost += Number(entry.total_cost || 0);
        acc[month].savings += Number(entry.potential_savings || 0);
        return acc;
      }, {});

      // Process recent data
      const processedRecent = (recentData || []).reduce((acc: Record<string, CostData>, resource) => {
        if (resource.cost_data && typeof resource.cost_data === 'object') {
          const month = new Date(resource.last_updated_at).toLocaleString('default', { month: 'short' });
          if (!acc[month]) {
            acc[month] = {
              month,
              cost: 0,
              savings: 0
            };
          }
          acc[month].cost += Number(resource.cost_data.totalCost || 0);
          acc[month].savings += Number(resource.cost_data.potentialSavings || 0);
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
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#0EA5E9] mr-2" />
            Costs
          </div>
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#22C55E] mr-2" />
            Potential Savings
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={costData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#0EA5E9"
                fill="#0EA5E9"
                strokeWidth={2}
                fillOpacity={0.1}
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="#22C55E"
                fill="#22C55E"
                strokeWidth={2}
                fillOpacity={0.1}
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}