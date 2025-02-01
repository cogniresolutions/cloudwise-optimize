import { Button } from "@/components/ui/button";
import { CloudProviderTab } from "@/components/dashboard/CloudProviderTab";
import { CostCard } from "@/components/dashboard/CostCard";
import { CostChart } from "@/components/dashboard/CostChart";
import { Plus } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [activeProvider, setActiveProvider] = useState<"aws" | "azure" | "gcp">("aws");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cloud Cost Dashboard</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Connect Cloud Provider
          </Button>
        </div>

        {/* Cloud Provider Tabs */}
        <div className="grid grid-cols-3 gap-4">
          <CloudProviderTab
            provider="aws"
            isConnected={true}
            onClick={() => setActiveProvider("aws")}
            isActive={activeProvider === "aws"}
          />
          <CloudProviderTab
            provider="azure"
            isConnected={false}
            onClick={() => setActiveProvider("azure")}
            isActive={activeProvider === "azure"}
          />
          <CloudProviderTab
            provider="gcp"
            isConnected={false}
            onClick={() => setActiveProvider("gcp")}
            isActive={activeProvider === "gcp"}
          />
        </div>

        {/* Cost Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CostCard
            title="Total Cost (MTD)"
            amount="$24,685"
            trend={12}
            trendLabel="from last month"
          />
          <CostCard
            title="Projected Cost"
            amount="$32,000"
            trend={8}
            trendLabel="vs budget"
          />
          <CostCard
            title="Potential Savings"
            amount="$3,240"
            trend={-15}
            trendLabel="if optimized"
          />
          <CostCard
            title="Resources"
            amount="234"
            trend={5}
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