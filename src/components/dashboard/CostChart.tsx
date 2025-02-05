import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface CostDataType {
  month: string;
  azure_cost: number;
  aws_cost: number;
  gcp_cost: number;
}

export function CostChart() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [costData, setCostData] = useState<CostDataType[]>([]);

  const fetchCostData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cloud_cost_overview')
        .select('*')
        .eq('user_id', session?.user.id)
        .gte('date', new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        month: new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' }),
        azure_cost: Number(item.azure_cost) || 0,
        aws_cost: Number(item.aws_cost) || 0,
        gcp_cost: Number(item.gcp_cost) || 0,
      }));

      setCostData(formattedData);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error fetching cost data",
        description: err instanceof Error ? err.message : "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchCostData();
    }
  }, [session?.user]);

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Cost Overview (Last 12 Months)</CardTitle>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-[#4e79a7]" />
            <span className="text-sm text-muted-foreground">Azure</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-[#f28e2b]" />
            <span className="text-sm text-muted-foreground">AWS</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-[#e15759]" />
            <span className="text-sm text-muted-foreground">GCP</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={costData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted))"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [`$${value}`, '']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="azure_cost"
                  name="Azure"
                  stroke="#4e79a7"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="aws_cost"
                  name="AWS"
                  stroke="#f28e2b"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="gcp_cost"
                  name="GCP"
                  stroke="#e15759"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}