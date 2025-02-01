import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Database, HardDrive } from "lucide-react";

interface ResourceType {
  name: string;
  count: number;
  usage: number;
  icon: React.ElementType;
}

interface ResourceUsageProps {
  provider: string;
}

export function ResourceUsage({ provider }: ResourceUsageProps) {
  const resourceData: { [key: string]: ResourceType[] } = {
    aws: [
      { name: "EC2 Instances", count: 45, usage: 65, icon: Server },
      { name: "RDS Databases", count: 12, usage: 78, icon: Database },
      { name: "EBS Volumes", count: 89, usage: 45, icon: HardDrive },
    ],
    azure: [
      { name: "Virtual Machines", count: 12, usage: 72, icon: Server },
      { name: "SQL Databases", count: 3, usage: 85, icon: Database },
      { name: "Storage Accounts", count: 8, usage: 52, icon: HardDrive },
    ],
    gcp: [
      { name: "Compute Instances", count: 29, usage: 58, icon: Server },
      { name: "Cloud SQL", count: 6, usage: 81, icon: Database },
      { name: "Persistent Disks", count: 42, usage: 48, icon: HardDrive },
    ],
  };

  const resources = resourceData[provider] || resourceData.aws;

  return (
    <Card className="col-span-4 animate-fade-in">
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div key={resource.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {resource.count} resources
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${resource.usage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{resource.usage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}