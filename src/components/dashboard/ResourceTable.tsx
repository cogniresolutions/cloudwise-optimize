import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChevronDown, ChevronUp, DollarSign, Server, Database, 
  HardDrive, Cloud, Cpu, BrainCog, Bot, LayoutGrid, Lightbulb 
} from "lucide-react";
import { ResourceType } from "./types";

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
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Resource Details:</h4>
                      <pre className="bg-white p-2 rounded-md border border-gray-200 whitespace-pre-wrap">
                        {resource.details}
                      </pre>
                    </div>
                    
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <div className="flex items-center text-yellow-500 mb-3">
                        <Lightbulb className="h-5 w-5 mr-2" />
                        <h4 className="font-semibold">Optimization Recommendations</h4>
                      </div>
                      
                      {resource.optimization_priority && (
                        <div className="mb-2">
                          <span className="font-semibold">Priority: </span>
                          <span className={`inline-block px-2 py-1 rounded text-sm ${
                            resource.optimization_priority === 'high' ? 'bg-red-100 text-red-800' :
                            resource.optimization_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {resource.optimization_priority.toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {resource.potential_savings && (
                        <div className="mb-2">
                          <span className="font-semibold">Potential Monthly Savings: </span>
                          <span className="text-green-600">${resource.potential_savings.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <p className="text-gray-700">{resource.recommendations}</p>
                      </div>
                      
                      {resource.action_items && resource.action_items.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-semibold mb-2">Recommended Actions:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {resource.action_items.map((action, index) => (
                              <li key={index} className="text-gray-700">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}