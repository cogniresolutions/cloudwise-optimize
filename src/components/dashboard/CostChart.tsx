import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", cost: 4000, savings: 200 },
  { month: "Feb", cost: 3000, savings: 400 },
  { month: "Mar", cost: 2000, savings: 300 },
  { month: "Apr", cost: 2780, savings: 450 },
  { month: "May", cost: 1890, savings: 500 },
  { month: "Jun", cost: 2390, savings: 600 },
];

export function CostChart() {
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
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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