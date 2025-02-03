import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, CloudOff, Loader2, Unlink } from "lucide-react";

interface CloudProviderTabProps {
  provider: "aws" | "azure" | "gcp";
  isConnected: boolean;
  onClick: () => void;
  isActive: boolean;
  isLoading?: boolean;
  onDisconnect?: () => void;
}

export function CloudProviderTab({ 
  provider, 
  isConnected, 
  onClick, 
  isActive,
  isLoading = false,
  onDisconnect
}: CloudProviderTabProps) {
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
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : isConnected ? (
              <Cloud className={`h-5 w-5 ${details.color}`} />
            ) : (
              <CloudOff className="h-5 w-5 text-gray-400" />
            )}
            <span className={isConnected ? details.color : "text-gray-400"}>
              {details.name}
            </span>
          </div>
          <span className={`text-sm ${isConnected ? "text-green-500" : "text-gray-400"}`}>
            {isLoading ? "Loading..." : isConnected ? "Connected" : "Not Connected"}
          </span>
        </div>
        {isConnected && onDisconnect && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDisconnect();
            }}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Unlink className="h-4 w-4 mr-1" />
                Disconnect
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}