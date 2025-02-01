import { Button } from "@/components/ui/button";
import { CloudProviderSelector } from "@/components/dashboard/CloudProviderSelector";
import { CostCard } from "@/components/dashboard/CostCard";
import { CostChart } from "@/components/dashboard/CostChart";
import { Plus } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [selectedProvider, setSelectedProvider] = useState("aws");

  const providerData = {
    aws: {
      totalCost: "$24,685",
      totalTrend: 12,
      projectedCost: "$32,000",
      projectedTrend: 8,
      potentialSavings: "$3,240",
      savingsTrend: -15,
      activeResources: "234",
      resourcesTrend: 5,
    },
    azure: {
      totalCost: "$18,450",
      totalTrend: 5,
      projectedCost: "$22,000",
      projectedTrend: 3,
      potentialSavings: "$2,800",
      savingsTrend: -12,
      activeResources: "186",
      resourcesTrend: 2,
    },
    gcp: {
      totalCost: "$15,720",
      totalTrend: 7,
      projectedCost: "$19,500",
      projectedTrend: 6,
      potentialSavings: "$1,950",
      savingsTrend: -8,
      activeResources: "142",
      resourcesTrend: 4,
    },
  };

  const currentData = providerData[selectedProvider as keyof typeof providerData];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cloud Cost Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and optimize your multi-cloud spending
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Connect Cloud Provider
          </Button>
        </div>

        {/* Cloud Provider Selector */}
        <CloudProviderSelector
          selectedProvider={selectedProvider}
          onSelect={setSelectedProvider}
        />

        {/* Cost Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CostCard
            title="Total Cost (MTD)"
            amount={currentData.totalCost}
            trend={currentData.totalTrend}
            trendLabel="from last month"
          />
          <CostCard
            title="Projected Cost"
            amount={currentData.projectedCost}
            trend={currentData.projectedTrend}
            trendLabel="vs budget"
          />
          <CostCard
            title="Potential Savings"
            amount={currentData.potentialSavings}
            trend={currentData.savingsTrend}
            trendLabel="if optimized"
          />
          <CostCard
            title="Active Resources"
            amount={currentData.activeResources}
            trend={currentData.resourcesTrend}
            trendLabel="new this month"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CostChart />
        </div>
      </div>
    </div>
  );
};

export default Index;