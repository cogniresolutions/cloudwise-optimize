import { CheckCircle, CloudOff, Loader2 } from "lucide-react";

interface ResourceStatusIndicatorProps {
  isLoading: boolean;
  isConnected: boolean;
}

export function ResourceStatusIndicator({ isLoading, isConnected }: ResourceStatusIndicatorProps) {
  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  
  if (isConnected) {
    return (
      <span className="text-green-500 flex items-center">
        <CheckCircle className="h-4 w-4 mr-1" /> Connected
      </span>
    );
  }
  
  return (
    <span className="text-red-500 flex items-center">
      <CloudOff className="h-4 w-4 mr-1" /> Not Connected
    </span>
  );
}