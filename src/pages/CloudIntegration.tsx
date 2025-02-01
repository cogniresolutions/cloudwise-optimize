import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudProviderSelector } from "@/components/dashboard/CloudProviderSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AzureConnectionWizard } from "@/components/dashboard/AzureConnectionWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Steps } from "@/components/ui/steps";
import { ArrowRight, Cloud, CloudCog } from "lucide-react";

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
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('cloud_provider_connections')
        .insert([
          {
            user_id: user.id,
            provider: selectedProvider,
            credentials: credentials || {}, 
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
      setShowAzureWizard(false);
    }
  };

  const handleProviderConnect = () => {
    if (selectedProvider === "azure") {
      setShowAzureWizard(true);
    } else {
      handleConnect();
    }
  };

  const steps = [
    {
      title: "Select Azure",
      description: "Click on the Azure card in the provider selection",
      icon: Cloud,
    },
    {
      title: "Connect Provider",
      description: "Click the 'Connect Provider' button below",
      icon: ArrowRight,
    },
    {
      title: "Complete Wizard",
      description: "Fill in your Azure credentials in the wizard",
      icon: CloudCog,
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Connect Cloud Provider</h1>
      
      {selectedProvider === "azure" && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Azure Connection Steps</h2>
            <Steps steps={steps} activeStep={showAzureWizard ? 3 : selectedProvider === "azure" ? 2 : 1} />
          </CardContent>
        </Card>
      )}

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