import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, DollarSign, Server } from "lucide-react";
import { ResourceType } from "./types";
import { ResourceDetails } from "./ResourceDetails";

interface ResourceTableProps {
  resources: ResourceType[];
}

export function ResourceTable({ resources }: ResourceTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (resourceType: string) => {
    setExpandedRows((prev) =>
      prev.includes(resourceType) ? prev.filter((r) => r !== resourceType) : [...prev, resourceType]
    );
  };

  const getIconForResourceType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'virtual machines': return <Server className="h-5 w-5 text-primary" />;
      case 'sql databases': return <Database className="h-5 w-5 text-primary" />;
      case 'storage accounts': return <HardDrive className="h-5 w-5 text-primary" />;
      case 'app services': return <Cloud className="h-5 w-5 text-primary" />;
      case 'kubernetes clusters': return <Cpu className="h-5 w-5 text-primary" />;
      case 'cognitive services': return <BrainCog className="h-5 w-5 text-primary" />;
      case 'azure openai': return <Bot className="h-5 w-5 text-primary" />;
      case 'container apps': return <LayoutGrid className="h-5 w-5 text-primary" />;
      default: return <Server className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resource Type</TableHead>
          <TableHead>Count</TableHead>
          <TableHead>Usage %</TableHead>
          <TableHead>Cost (USD)</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((resource) => (
          <React.Fragment key={resource.resource_type}>
            <TableRow>
              <TableCell className="font-medium flex items-center">
                {getIconForResourceType(resource.resource_type)}
                <span className="ml-2">{resource.resource_type}</span>
              </TableCell>
              <TableCell>{resource.count}</TableCell>
              <TableCell>{resource.usage_percentage}%</TableCell>
              <TableCell>
                {resource.cost !== null ? (
                  <div className="flex items-center text-green-600">
                    <DollarSign className="h-4 w-4 mr-1" /> {resource.cost.toFixed(2)}
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell>
                <button onClick={() => toggleRow(resource.resource_type)}>
                  {expandedRows.includes(resource.resource_type) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </TableCell>
            </TableRow>
            {expandedRows.includes(resource.resource_type) && (
              <TableRow>
                <TableCell colSpan={5} className="bg-gray-50 p-4">
                  <ResourceDetails resource={resource} />
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
