import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, AlertCircle } from "lucide-react";

interface AzureConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: any) => Promise<void>;
}

export function AzureConnectionWizard({ isOpen, onClose, onConnect }: AzureConnectionWizardProps) {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: "",
    subscriptionId: ""
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const steps = [
    {
      title: "Azure Client ID",
      description: "Enter your Azure Client ID from the App Registration",
      field: "clientId"
    },
    {
      title: "Client Secret",
      description: "Enter the Client Secret from your Azure App Registration",
      field: "clientSecret"
    },
    {
      title: "Tenant ID",
      description: "Enter your Azure Tenant ID",
      field: "tenantId"
    },
    {
      title: "Subscription ID",
      description: "Enter your Azure Subscription ID",
      field: "subscriptionId"
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmConnection = async () => {
    setIsValidating(true);
    try {
      await onConnect(credentials);
      onClose();
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setIsValidating(false);
      setShowConfirmDialog(false);
    }
  };

  const isStepValid = () => {
    return credentials[currentStep.field as keyof typeof credentials].length > 0;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader className="mb-6">
            <SheetTitle>Connect to Azure Cloud</SheetTitle>
            <SheetDescription>
              Step {step} of {steps.length}: {currentStep.description}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full ${
                    index + 1 <= step ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder={`Enter ${currentStep.title}`}
                value={credentials[currentStep.field as keyof typeof credentials]}
                onChange={(e) => handleInputChange(currentStep.field, e.target.value)}
              />

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  {step === steps.length ? "Review" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Azure Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Please verify your Azure credentials before proceeding. This will attempt to establish a connection with your Azure account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-2">
            {Object.entries(credentials).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium">{key}:</span>
                <span className="text-sm text-gray-500">
                  {value.substring(0, 6)}...{value.substring(value.length - 4)}
                </span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConnection}
              disabled={isValidating}
              className="bg-primary"
            >
              {isValidating ? (
                "Validating..."
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Confirm Connection
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}