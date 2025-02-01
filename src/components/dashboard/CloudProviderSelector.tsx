import { useState } from "react";
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });

  // Fetch connection status on component mount
  useState(() => {
    if (session?.user) {
      fetchConnectionStatus();
    }
  });

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
    } catch (error) {
      console.error('Error fetching cloud connections:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cloud provider connections",
      });
    }
  };

  const handleProviderClick = async (provider: string) => {
    setIsConnecting(true);
    try {
      if (!connectionStatus[provider as keyof typeof connectionStatus]) {
        const { error } = await supabase
          .from('cloud_provider_connections')
          .insert([
            {
              user_id: session?.user.id,
              provider,
              credentials: {},
              is_active: true
            }
          ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Connected to ${provider.toUpperCase()}`,
        });

        // Update local state
        setConnectionStatus(prev => ({
          ...prev,
          [provider]: true
        }));
      }
      onSelect(provider);
    } catch (error) {
      console.error('Error connecting to provider:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to connect to ${provider.toUpperCase()}`,
      });
    } finally {
      setIsConnecting(false);
    }
  };

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
            onClick={() => handleProviderClick(provider)}
            isLoading={isConnecting}
          />
        ))}
      </CardContent>
    </Card>
  );
}