import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CostData = {
  month: string;
  cost: number;
  savings: number;
  isPredicted?: boolean;
};

export function CostChart() {
  const { data: costData, isLoading } = useQuery({
    queryKey: ['costPredictions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-cost-predictions');
      if (error) throw error;
      return data.data as CostData[];
    },
  });

  if (isLoading) {
    return (
      <Card className="col-span-4 animate-pulse">
        <CardHeader>
          <CardTitle>Cost Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] bg-muted/10" />
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
            Savings
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-muted mr-1" />
            Predicted
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
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CostData;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{data.month}</span>
                            {data.isPredicted && (
                              <span className="text-xs text-muted-foreground">(Predicted)</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="font-medium">${data.cost}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Savings:</span>
                            <span className="font-medium">${data.savings}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorCost)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="hsl(var(--secondary))"
                fillOpacity={1}
                fill="url(#colorSavings)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}