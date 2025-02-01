import { Card, CardContent } from "@/components/ui/card";
import { CloudProviderTab } from "./CloudProviderTab";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface CloudProviderSelectorProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
}

type ConnectionStatus = "connected" | "error" | "configuring" | "not_connected";

export function CloudProviderSelector({ selectedProvider, onSelect }: CloudProviderSelectorProps) {
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({
    aws: "not_connected",
    azure: "not_connected",
    gcp: "not_connected",
  });
  const [disconnectProvider, setDisconnectProvider] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('cloud_provider_connections')
          .select('provider, is_active')
          .eq('user_id', user.id);

        if (data) {
          const status: Record<string, ConnectionStatus> = {
            aws: "not_connected",
            azure: "not_connected",
            gcp: "not_connected",
          };
          data.forEach(conn => {
            if (conn.is_active) {
              status[conn.provider] = "connected";
            }
          });
          setConnectionStatus(status);
        }
      }
    };

    // Initial fetch
    fetchConnections();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('cloud-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cloud_provider_connections',
        },
        () => {
          // Refresh connection statuses when changes occur
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDisconnect = async () => {
    if (!disconnectProvider) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cloud_provider_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', disconnectProvider);

      if (error) throw error;

      toast({
        title: "Provider Disconnected",
        description: `Successfully disconnected from ${disconnectProvider.toUpperCase()}`,
      });

      // Reset selected provider if it was the disconnected one
      if (selectedProvider === disconnectProvider) {
        onSelect("");
      }
    } catch (error) {
      console.error('Error disconnecting provider:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect provider. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDisconnectProvider(null);
    }
  };

  const providers = ["aws", "azure", "gcp"] as const;

  return (
    <>
      <Card className="col-span-full animate-fade-in">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          {providers.map((provider) => (
            <CloudProviderTab
              key={provider}
              provider={provider}
              isConnected={connectionStatus[provider] === "connected"}
              isActive={selectedProvider === provider}
              onClick={() => onSelect(provider)}
              connectionStatus={connectionStatus[provider]}
              onDisconnect={
                connectionStatus[provider] === "connected"
                  ? () => setDisconnectProvider(provider)
                  : undefined
              }
            />
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={!!disconnectProvider} onOpenChange={() => setDisconnectProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Disconnection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect from {disconnectProvider?.toUpperCase()}? This will remove your cloud provider connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}