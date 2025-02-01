import { Card, CardContent } from "@/components/ui/card";
import { CloudProviderTab } from "./CloudProviderTab";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CloudProviderSelectorProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
}

export function CloudProviderSelector({ selectedProvider, onSelect }: CloudProviderSelectorProps) {
  const [connectionStatus, setConnectionStatus] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });

  useEffect(() => {
    const fetchConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('cloud_provider_connections')
          .select('provider, is_active')
          .eq('user_id', user.id);

        if (data) {
          const status = {
            aws: false,
            azure: false,
            gcp: false,
          };
          data.forEach(conn => {
            if (conn.is_active) {
              status[conn.provider as keyof typeof status] = true;
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

  const providers = ["aws", "azure", "gcp"] as const;

  return (
    <Card className="col-span-full animate-fade-in">
      <CardContent className="grid gap-4 p-6 md:grid-cols-3">
        {providers.map((provider) => (
          <CloudProviderTab
            key={provider}
            provider={provider}
            isConnected={connectionStatus[provider]}
            isActive={selectedProvider === provider}
            onClick={() => onSelect(provider)}
            connectionStatus={connectionStatus[provider] ? "connected" : "not_connected"}
          />
        ))}
      </CardContent>
    </Card>
  );
}