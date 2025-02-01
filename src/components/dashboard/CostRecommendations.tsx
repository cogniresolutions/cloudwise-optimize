import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Zap } from "lucide-react";

interface CostRecommendationsProps {
  provider: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  icon: React.ElementType;
}

export function CostRecommendations({ provider }: CostRecommendationsProps) {
  const recommendationsData: { [key: string]: Recommendation[] } = {
    aws: [
      {
        id: "1",
        title: "Underutilized EC2 Instances",
        description: "3 instances have less than 10% CPU utilization",
        impact: "Potential savings: $420/month",
        icon: DollarSign,
      },
      {
        id: "2",
        title: "Reserved Instance Opportunity",
        description: "Convert 5 on-demand instances to reserved instances",
        impact: "Potential savings: $850/month",
        icon: Zap,
      },
    ],
    azure: [
      {
        id: "1",
        title: "Idle VMs Detected",
        description: "2 VMs have been idle for 7+ days",
        impact: "Potential savings: $280/month",
        icon: AlertTriangle,
      },
      {
        id: "2",
        title: "Storage Tier Optimization",
        description: "Move rarely accessed data to cool storage",
        impact: "Potential savings: $150/month",
        icon: Zap,
      },
    ],
    gcp: [
      {
        id: "1",
        title: "Sustained Use Discounts",
        description: "Eligible for discounts on 4 instances",
        impact: "Potential savings: $320/month",
        icon: DollarSign,
      },
      {
        id: "2",
        title: "Unattached Persistent Disks",
        description: "3 disks are not attached to any VM",
        impact: "Potential savings: $95/month",
        icon: AlertTriangle,
      },
    ],
  };

  const recommendations = recommendationsData[provider] || recommendationsData.aws;

  return (
    <Card className="col-span-4 animate-fade-in">
      <CardHeader>
        <CardTitle>Cost Optimization Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {recommendations.map((recommendation) => {
            const Icon = recommendation.icon;
            return (
              <div
                key={recommendation.id}
                className="flex items-start space-x-4 rounded-lg border p-4"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{recommendation.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {recommendation.impact}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}