import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CloudProviderTab } from "./CloudProviderTab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface CloudProviderSelectorProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
}

export function CloudProviderSelector({ selectedProvider, onSelect }: CloudProviderSelectorProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  // Fetch connection status on component mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchConnectionStatus();
    }
  }, [session?.user]);

  // Set up real-time subscription for connection status updates
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('cloud-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cloud_provider_connections',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchConnectionStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  const fetchConnectionStatus = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching connection status for user:', session.user.id);
      const { data, error } = await supabase
        .from('cloud_provider_connections')
        .select('provider, is_active, last_sync_at')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching cloud connections:', error);
        throw error;
      }

      const newStatus = { aws: false, azure: false, gcp: false };
      
      // Check if connections are active and recently synced (within last hour)
      data?.forEach((connection) => {
        if (connection.provider in newStatus) {
          const lastSyncTime = new Date(connection.last_sync_at).getTime();
          const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
          
          // Connection is considered active if is_active is true and last sync was within the last hour
          newStatus[connection.provider as keyof typeof newStatus] = 
            connection.is_active && lastSyncTime > oneHourAgo;
        }
      });

      console.log('Updated connection status:', newStatus);
      setConnectionStatus(newStatus);
    } catch (error) {
      console.error('Error fetching cloud connections:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cloud provider connections",
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

      await fetchConnectionStatus();
      toast({
        title: "Success",
        description: `Successfully disconnected from ${provider.toUpperCase()}`,
      });
      
      // If the disconnected provider was selected, select another connected provider or default to 'aws'
      if (selectedProvider === provider) {
        const connectedProvider = Object.entries(connectionStatus).find(([_, isConnected]) => isConnected)?.[0];
        onSelect(connectedProvider || 'aws');
      }
    } catch (error) {
      console.error(`Error disconnecting from ${provider}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to disconnect from ${provider.toUpperCase()}`,
      });
    } finally {
      setIsDisconnecting(null);
    }
  };

  const handleProviderClick = (provider: string) => {
    if (isDisconnecting === provider) return;
    
    if (connectionStatus[provider as keyof typeof connectionStatus]) {
      onSelect(provider);
    } else {
      // For now, just select the provider - connection functionality will be handled separately
      onSelect(provider);
      toast({
        title: "Info",
        description: `Please use the cloud connection sheet to connect to ${provider.toUpperCase()}`,
      });
    }
  };

  const providers = ["aws", "azure", "gcp"] as const;

  return (
    <Card>
      <CardContent className="flex space-x-4 p-6">
        {providers.map((provider) => (
          <CloudProviderTab
            key={provider}
            provider={provider}
            isConnected={connectionStatus[provider]}
            isActive={selectedProvider === provider}
            onClick={() => handleProviderClick(provider)}
            isLoading={isLoading || isDisconnecting === provider}
            onDisconnect={
              connectionStatus[provider] 
                ? () => disconnectProvider(provider)
                : undefined
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}