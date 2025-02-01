import { Card } from "@/components/ui/card";
import { Cloud, CloudCog } from "lucide-react";

interface CloudProviderTabProps {
  provider: "aws" | "azure" | "gcp";
  isConnected: boolean;
  onClick: () => void;
  isActive: boolean;
}

export function CloudProviderTab({ provider, isConnected, onClick, isActive }: CloudProviderTabProps) {
  const getProviderDetails = () => {
    switch (provider) {
      case "aws":
        return { name: "AWS", color: "text-[#FF9900]" };
      case "azure":
        return { name: "Azure", color: "text-[#008AD7]" };
      case "gcp":
        return { name: "GCP", color: "text-[#4285F4]" };
    }
  };

  const details = getProviderDetails();

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? "border-primary border-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Cloud className={`h-5 w-5 ${details.color}`} />
          ) : (
            <CloudCog className="h-5 w-5 text-gray-400" />
          )}
          <span className={isConnected ? details.color : "text-gray-400"}>
            {details.name}
          </span>
        </div>
        <span className={`text-sm ${isConnected ? "text-green-500" : "text-gray-400"}`}>
          {isConnected ? "Connected" : "Not Connected"}
        </span>
      </div>
    </Card>
  );
}