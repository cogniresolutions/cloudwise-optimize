import { LucideIcon } from "lucide-react";

interface Step {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface StepsProps {
  steps: Step[];
  activeStep: number;
}

export function Steps({ steps, activeStep }: StepsProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index + 1 === activeStep;
        const isCompleted = index + 1 < activeStep;

        return (
          <div
            key={step.title}
            className={`flex items-start space-x-4 ${
              isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-gray-500"
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}