import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface CostCardProps {
  title: string;
  amount: string;
  trend: number;
  trendLabel: string;
}

export function CostCard({ title, amount, trend, trendLabel }: CostCardProps) {
  const isPositive = trend > 0;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{amount}</div>
        <div className="flex items-center pt-1">
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4 text-red-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-green-500" />
          )}
          <span className={`text-xs ${isPositive ? "text-red-500" : "text-green-500"}`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-muted-foreground pl-1">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}