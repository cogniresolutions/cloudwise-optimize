import { Card } from "@/components/ui/card";
import { Cloud, CloudCog, AlertCircle, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConnectionStatus = "connected" | "error" | "configuring" | "not_connected";

interface CloudProviderTabProps {
  provider: "aws" | "azure" | "gcp";
  isConnected: boolean;
  onClick: () => void;
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  onDisconnect?: () => void;
}

export function CloudProviderTab({ 
  provider, 
  isConnected, 
  onClick, 
  isActive,
  connectionStatus,
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

  const getStatusDetails = () => {
    switch (connectionStatus) {
      case "connected":
        return { 
          text: "Connected", 
          color: "text-green-500",
          icon: Cloud 
        };
      case "error":
        return { 
          text: "Connection Error", 
          color: "text-red-500",
          icon: AlertCircle 
        };
      case "configuring":
        return { 
          text: "Configuring...", 
          color: "text-blue-500",
          icon: CloudCog 
        };
      default:
        return { 
          text: "Not Connected", 
          color: "text-gray-400",
          icon: CloudCog 
        };
    }
  };

  const details = getProviderDetails();
  const status = getStatusDetails();
  const StatusIcon = status.icon;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? "border-primary border-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-5 w-5 ${isConnected ? details.color : "text-gray-400"}`} />
          <span className={isConnected ? details.color : "text-gray-400"}>
            {details.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${status.color}`}>
            {status.text}
          </span>
          {connectionStatus === "connected" && onDisconnect && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect();
              }}
            >
              <Power className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}