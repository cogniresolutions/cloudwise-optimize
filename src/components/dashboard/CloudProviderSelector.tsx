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

  // Fetch connection status on component mount
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
    } catch (error) {
      console.error('Error fetching cloud connections:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch cloud provider connections",
      });
    }
  };

  const handleProviderClick = (provider: string) => {
    onSelect(provider);
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
          />
        ))}
      </CardContent>
    </Card>
  );
}