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

  // Fetch connection status on component mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchConnectionStatus();
    }
  }, [session?.user]);

  const fetchConnectionStatus = async () => {
    try {
      console.log('Fetching connection status for user:', session?.user.id);
      const { data, error } = await supabase
        .from('cloud_provider_connections')
        .select('provider, is_active')
        .eq('user_id', session?.user.id);

      if (error) {
        console.error('Error fetching cloud connections:', error);
        throw error;
      }

      const newStatus = { aws: false, azure: false, gcp: false };
      data?.forEach((connection) => {
        if (connection.provider in newStatus) {
          newStatus[connection.provider as keyof typeof newStatus] = connection.is_active;
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
    }
  };

  const connectToAzure = async () => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to connect to Azure",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // For demo purposes, we'll use mock credentials
      // In a real app, you would integrate with Azure OAuth
      const mockAzureCredentials = {
        subscriptionId: "mock-subscription-id",
        tenantId: "mock-tenant-id",
        clientId: "mock-client-id",
        clientSecret: "mock-client-secret"
      };

      const { error: upsertError } = await supabase
        .from('cloud_provider_connections')
        .upsert({
          user_id: session.user.id,
          provider: 'azure',
          credentials: mockAzureCredentials,
          is_active: true,
          last_sync_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      await fetchConnectionStatus();
      toast({
        title: "Success",
        description: "Successfully connected to Azure",
      });
      onSelect('azure');
    } catch (error) {
      console.error('Error connecting to Azure:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to Azure",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleProviderClick = async (provider: string) => {
    if (provider === 'azure' && !connectionStatus.azure) {
      await connectToAzure();
    } else {
      onSelect(provider);
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
          />
        ))}
      </CardContent>
    </Card>
  );
}