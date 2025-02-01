import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudProviderSelector } from "@/components/dashboard/CloudProviderSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AzureConnectionWizard } from "@/components/dashboard/AzureConnectionWizard";

export default function CloudIntegration() {
  const [selectedProvider, setSelectedProvider] = useState<string>("aws");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAzureWizard, setShowAzureWizard] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConnect = async (credentials?: any) => {
    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to connect cloud providers",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('cloud_provider_connections')
        .insert([
          {
            user_id: user.id,
            provider: selectedProvider,
            credentials: credentials || {}, // Use provided credentials or empty object
            is_active: true
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully connected to ${selectedProvider.toUpperCase()}`,
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleProviderConnect = () => {
    if (selectedProvider === "azure") {
      setShowAzureWizard(true);
    } else {
      handleConnect();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Connect Cloud Provider</h1>
      <div className="space-y-6">
        <CloudProviderSelector
          selectedProvider={selectedProvider}
          onSelect={setSelectedProvider}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleProviderConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Provider"}
          </Button>
        </div>
      </div>

      <AzureConnectionWizard
        isOpen={showAzureWizard}
        onClose={() => setShowAzureWizard(false)}
        onConnect={handleConnect}
      />
    </div>
  );
}