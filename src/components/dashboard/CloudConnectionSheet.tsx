import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, CloudOff, Loader2, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface CloudConnectionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloudConnectionSheet({ isOpen, onOpenChange }: CloudConnectionSheetProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [azureCostData, setAzureCostData] = useState<any>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchConnectionStatus();
    }
  }, [session?.user]);

  const fetchConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('cloud_provider_connections')
        .select('provider, is_active')
        .eq('user_id', session?.user.id);

      if (error) throw error;

      const newStatus = { aws: false, azure: false, gcp: false };
      data.forEach((connection) => {
        if (connection.provider in newStatus) {
          newStatus[connection.provider as keyof typeof newStatus] = connection.is_active;
        }
      });
      setConnectionStatus(newStatus);

      if (newStatus.azure) {
        fetchAzureCostData();
      }
    } catch (error) {
      console.error('Error fetching cloud connections:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cloud provider connections",
      });
    }
  };

  const fetchAzureCostData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-azure-costs');
      
      if (error) throw error;
      
      setAzureCostData(data);
      toast({
        title: "Success",
        description: "Azure cost data fetched successfully",
      });
    } catch (error) {
      console.error('Error fetching Azure cost data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch Azure cost data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectProvider = async (provider: string) => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to disconnect from a provider",
      });
      return;
    }

    setIsDisconnecting(provider);
    
    // Optimistically update UI
    setConnectionStatus(prev => ({
      ...prev,
      [provider]: false
    }));

    try {
      const { error } = await supabase
        .from('cloud_provider_connections')
        .update({ 
          is_active: false,
          credentials: null,
          last_sync_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .eq('provider', provider);

      if (error) throw error;

      // Clear Azure cost data if disconnecting from Azure
      if (provider === 'azure') {
        setAzureCostData(null);
      }

      toast({
        title: "Success",
        description: `Successfully disconnected from ${provider.toUpperCase()}`,
      });

    } catch (error) {
      console.error(`Error disconnecting from ${provider}:`, error);
      
      // Revert the optimistic update on error
      setConnectionStatus(prev => ({
        ...prev,
        [provider]: true
      }));
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to disconnect from ${provider.toUpperCase()}`,
      });
    } finally {
      setIsDisconnecting(null);
      // Refresh connection status to ensure UI is in sync with server
      await fetchConnectionStatus();
    }
  };

  const getProviderDetails = (provider: string) => {
    switch (provider) {
      case "aws":
        return { name: "AWS", color: "text-[#FF9900]" };
      case "azure":
        return { name: "Azure", color: "text-[#008AD7]" };
      case "gcp":
        return { name: "GCP", color: "text-[#4285F4]" };
      default:
        return { name: provider.toUpperCase(), color: "text-gray-400" };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Cloud Provider Status</SheetTitle>
          <SheetDescription>
            Current connection status for your cloud providers
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-1 gap-4 mt-6">
          {Object.entries(connectionStatus).map(([provider, isConnected]) => {
            const details = getProviderDetails(provider);
            const isDisconnectingThis = isDisconnecting === provider;
            
            return (
              <Card key={provider} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <Cloud className={`h-5 w-5 ${details.color}`} />
                    ) : (
                      <CloudOff className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={isConnected ? details.color : "text-gray-400"}>
                      {details.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${isConnected ? "text-green-500" : "text-gray-400"}`}>
                      {isConnected ? "Connected" : "Not Connected"}
                    </span>
                    {isConnected && (
                      <div className="flex items-center space-x-2">
                        {provider === 'azure' && (
                          <button
                            onClick={fetchAzureCostData}
                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                            disabled={isLoading || isDisconnectingThis}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Cloud className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectProvider(provider)}
                          disabled={isDisconnectingThis}
                          className="ml-2"
                        >
                          {isDisconnectingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Unlink className="h-4 w-4 mr-1" />
                              Disconnect
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {provider === 'azure' && isConnected && azureCostData && (
                  <div className="mt-4 text-sm">
                    <p>Latest Cost Data:</p>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(azureCostData, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
