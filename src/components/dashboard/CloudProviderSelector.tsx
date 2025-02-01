import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CloudProviderTab } from "./CloudProviderTab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

interface CloudProviderSelectorProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
}

interface AzureCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
}

export function CloudProviderSelector({ selectedProvider, onSelect }: CloudProviderSelectorProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    aws: false,
    azure: false,
    gcp: false,
  });

  const { register, handleSubmit, reset } = useForm<AzureCredentials>();

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

  const handleProviderClick = async (provider: string) => {
    if (provider === 'azure') {
      setSelectedCloudProvider(provider);
      setShowCredentialsDialog(true);
      return;
    }

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

  const onSubmitAzureCredentials = async (data: AzureCredentials) => {
    setIsConnecting(true);
    try {
      const { error } = await supabase
        .from('cloud_provider_connections')
        .insert([
          {
            user_id: session?.user.id,
            provider: 'azure',
            credentials: {
              clientId: data.clientId,
              clientSecret: data.clientSecret,
              tenantId: data.tenantId,
              subscriptionId: data.subscriptionId
            },
            is_active: true
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Connected to Azure successfully",
      });

      setConnectionStatus(prev => ({
        ...prev,
        azure: true
      }));
      
      setShowCredentialsDialog(false);
      reset();
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

  const providers = ["aws", "azure", "gcp"] as const;

  return (
    <>
      <Card>
        <CardContent className="flex space-x-4 p-6">
          {providers.map((provider) => (
            <CloudProviderTab
              key={provider}
              provider={provider}
              isConnected={connectionStatus[provider]}
              isActive={selectedProvider === provider}
              onClick={() => handleProviderClick(provider)}
              isLoading={isConnecting && selectedCloudProvider === provider}
            />
          ))}
        </CardContent>
      </Card>

      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect to Azure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAzureCredentials)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                {...register("clientId", { required: true })}
                placeholder="Enter your Azure Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                {...register("clientSecret", { required: true })}
                placeholder="Enter your Client Secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                {...register("tenantId", { required: true })}
                placeholder="Enter your Tenant ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <Input
                id="subscriptionId"
                {...register("subscriptionId", { required: true })}
                placeholder="Enter your Subscription ID"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCredentialsDialog(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}