import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cloud, CloudCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface CloudConnectionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProviderSelect: (provider: string) => void;
}

interface AzureCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
}

export function CloudConnectionSheet({ isOpen, onOpenChange, onProviderSelect }: CloudConnectionSheetProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAzureDialog, setShowAzureDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<AzureCredentials>();

  const handleProviderClick = async (provider: string) => {
    if (provider === 'azure') {
      setSelectedProvider(provider);
      setShowAzureDialog(true);
      return;
    }

    setIsConnecting(true);
    try {
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

      onProviderSelect(provider);
      onOpenChange(false);
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
      
      setShowAzureDialog(false);
      reset();
      onProviderSelect('azure');
      onOpenChange(false);
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Connect Cloud Provider</SheetTitle>
            <SheetDescription>
              Select a cloud provider to connect to your account
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {["aws", "azure", "gcp"].map((provider) => (
              <Card
                key={provider}
                className="p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleProviderClick(provider)}
              >
                <div className="flex flex-col items-center space-y-2">
                  {isConnecting && selectedProvider === provider ? (
                    <CloudCog className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <Cloud className="h-8 w-8 text-primary" />
                  )}
                  <span className="font-medium">{provider.toUpperCase()}</span>
                </div>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showAzureDialog} onOpenChange={setShowAzureDialog}>
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
                  setShowAzureDialog(false);
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