import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Cost Overview</CardTitle>
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-[#0EA5E9] mr-2" />
            <span className="font-medium">Costs</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-[#22C55E] mr-2" />
            <span className="font-medium">Potential Savings</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={costData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barGap={0}
              barCategoryGap="25%"
            >
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dx={-10}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar
                dataKey="cost"
                fill="#0EA5E9"
                radius={[4, 4, 0, 0]}
                stackId="stack"
                maxBarSize={50}
              />
              <Bar
                dataKey="savings"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                stackId="stack"
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}