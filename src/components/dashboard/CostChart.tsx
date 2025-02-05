import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface CostDataType {
  month: string;
  azure_total_cost: number;
  azure_savings: number;
  aws_total_cost: number;
  aws_savings: number;
  gcp_total_cost: number;
  gcp_savings: number;
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
        azure_total_cost: Number(item.azure_cost) || 0,
        azure_savings: Number(item.azure_savings) || 0,
        aws_total_cost: Number(item.aws_cost) || 0,
        aws_savings: Number(item.aws_savings) || 0,
        gcp_total_cost: Number(item.gcp_cost) || 0,
        gcp_savings: Number(item.gcp_savings) || 0,
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
    <Card className="p-4 shadow-lg">
      <CardHeader>
        <CardTitle>Cost & Savings Overview (Last 12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={costData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#8884d8" />
              <YAxis stroke="#8884d8" tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                formatter={(value) => `$${value}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} />
              
              {/* Azure Data */}
              <Bar dataKey="azure_total_cost" name="Azure Total Cost" stackId="azure" fill="#4e79a7" />
              <Bar dataKey="azure_savings" name="Azure Savings" stackId="azure" fill="#76b7b2" />

              {/* AWS Data */}
              <Bar dataKey="aws_total_cost" name="AWS Total Cost" stackId="aws" fill="#f28e2b" />
              <Bar dataKey="aws_savings" name="AWS Savings" stackId="aws" fill="#ffbe7d" />

              {/* GCP Data */}
              <Bar dataKey="gcp_total_cost" name="GCP Total Cost" stackId="gcp" fill="#e15759" />
              <Bar dataKey="gcp_savings" name="GCP Savings" stackId="gcp" fill="#ff9d9a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}