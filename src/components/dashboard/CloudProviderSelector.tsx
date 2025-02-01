import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud } from "lucide-react";

interface CloudProviderSelectorProps {
  selectedProvider: string;
  onSelect: (provider: string) => void;
}

export function CloudProviderSelector({ selectedProvider, onSelect }: CloudProviderSelectorProps) {
  const providers = [
    { id: "aws", name: "AWS" },
    { id: "azure", name: "Azure" },
    { id: "gcp", name: "Google Cloud" },
  ];

  return (
    <Card className="col-span-full animate-fade-in">
      <CardContent className="flex gap-4 p-6">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant={selectedProvider === provider.id ? "default" : "outline"}
            className="flex-1"
            onClick={() => onSelect(provider.id)}
          >
            <Cloud className="mr-2 h-4 w-4" />
            {provider.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}