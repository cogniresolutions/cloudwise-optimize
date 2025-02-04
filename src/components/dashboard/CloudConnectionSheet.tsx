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
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [resourceCounts, setResourceCounts] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetchConnectionStatus();
    }
  }, [session?.user]);

  const fetchConnectionStatus = async () => {
    if (!session?.user?.id) return;
    
    try {
      console.log('Fetching connection status for user:', session.user.id);
      const { data, error } = await supabase
        .from('cloud_provider_connections')
        .select('provider, is_active, last_sync_at, credentials')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching cloud connections:', error);
        throw error;
      }

      const newStatus = { aws: false, azure: false, gcp: false };
      
      data?.forEach((connection) => {
        if (connection.provider in newStatus) {
          const lastSyncTime = new Date(connection.last_sync_at).getTime();
          const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
          
          newStatus[connection.provider as keyof typeof newStatus] = 
            connection.is_active && lastSyncTime > oneHourAgo && connection.credentials !== null;
        }
      });

      console.log('Updated connection status:', newStatus);
      setConnectionStatus(newStatus);

      // If Azure is connected, fetch resource data
      if (newStatus.azure) {
        await fetchAzureResources();
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

  const fetchAzureResources = async () => {
    try {
      console.log('Fetching Azure resources...');
      const { data: resourceData, error: resourceError } = await supabase.functions.invoke('fetch-azure-resource-counts');
      
      if (resourceError) throw resourceError;
      
      console.log('Azure resources fetched:', resourceData);
      setResourceCounts(resourceData.data);
      
      toast({
        title: "Success",
        description: "Azure resources fetched successfully",
      });
    } catch (error) {
      console.error('Error fetching Azure resources:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch Azure resources",
      });
    }
  };

  const connectProvider = async (provider: string) => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to connect to a provider",
      });
      return;
    }

    setIsConnecting(provider);
    try {
      let credentials = null;
      
      switch (provider) {
        case 'azure':
          credentials = {
            clientId: prompt("Enter Azure Service Principal Client ID:"),
            clientSecret: prompt("Enter Azure Service Principal Client Secret:"),
            tenantId: prompt("Enter Azure Tenant ID:"),
            subscriptionId: prompt("Enter Azure Subscription ID:")
          };

          if (!credentials.clientId || !credentials.clientSecret || !credentials.tenantId || !credentials.subscriptionId) {
            throw new Error("All Azure service principal credentials are required");
          }
          break;

        case 'aws':
          credentials = {
            accessKeyId: prompt("Enter AWS Access Key ID:"),
            secretAccessKey: prompt("Enter AWS Secret Access Key:"),
            region: prompt("Enter AWS Region (e.g., us-east-1):") || 'us-east-1'
          };

          if (!credentials.accessKeyId || !credentials.secretAccessKey) {
            throw new Error("AWS Access Key ID and Secret Access Key are required");
          }
          break;

        case 'gcp':
          const serviceAccountKey = prompt("Enter GCP Service Account Key JSON:");
          if (!serviceAccountKey) {
            throw new Error("GCP Service Account Key is required");
          }

          try {
            credentials = JSON.parse(serviceAccountKey);
            if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
              throw new Error("Invalid GCP Service Account Key format");
            }
          } catch (e) {
            throw new Error("Invalid GCP Service Account Key JSON format");
          }
          break;
      }

      const { data, error } = await supabase
        .from('cloud_provider_connections')
        .upsert({
          user_id: session.user.id,
          provider,
          credentials,
          is_active: true,
          last_sync_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully connected to ${provider.toUpperCase()}`,
      });

      setConnectionStatus(prev => ({
        ...prev,
        [provider]: true
      }));

      // Fetch initial data based on provider
      if (provider === 'azure') {
        await fetchAzureResources();
      }
    } catch (error: any) {
      console.error(`Error connecting to ${provider}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to connect to ${provider.toUpperCase()}`,
      });
    } finally {
      setIsConnecting(null);
      await fetchConnectionStatus();
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
    console.log(`Attempting to disconnect from ${provider}...`);

    try {
      const { error } = await supabase
        .from('cloud_provider_connections')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', provider);

      if (error) throw error;

      // Clear provider-specific data
      if (provider === 'azure') {
        setResourceCounts(null);
      }

      setConnectionStatus(prev => ({
        ...prev,
        [provider]: false
      }));

      toast({
        title: "Success",
        description: `Successfully disconnected from ${provider.toUpperCase()}`,
      });
    } catch (error) {
      console.error(`Error disconnecting from ${provider}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to disconnect from ${provider.toUpperCase()}`,
      });
    } finally {
      setIsDisconnecting(null);
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
            const isConnectingThis = isConnecting === provider;
            
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
                    {isConnected ? (
                      <div className="flex items-center space-x-2">
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
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectProvider(provider)}
                        disabled={isConnectingThis}
                      >
                        {isConnectingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Cloud className="h-4 w-4 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {provider === 'azure' && isConnected && (
                  <div className="mt-4 space-y-4">
                    {resourceCounts && (
                      <div className="text-sm">
                        <p>Resource Counts:</p>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(resourceCounts, null, 2)}
                        </pre>
                      </div>
                    )}
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
