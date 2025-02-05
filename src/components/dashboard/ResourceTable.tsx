import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChevronDown, ChevronUp, DollarSign, Server, Database, 
  HardDrive, Cloud, Cpu, BrainCog, Bot, LayoutGrid, Lightbulb 
} from "lucide-react";
import { ResourceType } from "./types";
import { cn } from "@/lib/utils";

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
      case 'virtual machines': return <Server className="h-5 w-5 text-blue-500" />;
      case 'sql databases': return <Database className="h-5 w-5 text-purple-500" />;
      case 'storage accounts': return <HardDrive className="h-5 w-5 text-orange-500" />;
      case 'app services': return <Cloud className="h-5 w-5 text-green-500" />;
      case 'kubernetes clusters': return <Cpu className="h-5 w-5 text-red-500" />;
      case 'cognitive services': return <BrainCog className="h-5 w-5 text-indigo-500" />;
      case 'azure openai': return <Bot className="h-5 w-5 text-pink-500" />;
      case 'container apps': return <LayoutGrid className="h-5 w-5 text-cyan-500" />;
      default: return <Server className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[40%] px-6">Resource Type</TableHead>
            <TableHead className="w-[15%] text-center">Count</TableHead>
            <TableHead className="w-[25%] text-center">Usage %</TableHead>
            <TableHead className="w-[15%] text-center">Cost (USD)</TableHead>
            <TableHead className="w-[5%] text-center">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <React.Fragment key={resource.resource_type}>
              <TableRow className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium px-6">
                  <div className="flex items-center space-x-3">
                    {getIconForResourceType(resource.resource_type)}
                    <span className="text-sm font-medium">{resource.resource_type}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {resource.count}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center px-4">
                    <div className="w-full bg-secondary/30 rounded-full h-2.5">
                      <div
                        className={cn(
                          "h-2.5 rounded-full transition-all duration-500",
                          resource.usage_percentage > 80 ? "bg-red-500" :
                          resource.usage_percentage > 60 ? "bg-yellow-500" :
                          "bg-green-500"
                        )}
                        style={{ width: `${resource.usage_percentage}%` }}
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium">{resource.usage_percentage}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {resource.cost !== null ? (
                    <div className="flex items-center justify-center text-green-600 font-medium">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {resource.cost.toFixed(2)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <button 
                    onClick={() => toggleRow(resource.resource_type)}
                    className="w-full flex items-center justify-center hover:bg-muted rounded-full p-1 transition-colors"
                  >
                    {expandedRows.includes(resource.resource_type) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </TableCell>
              </TableRow>
              {expandedRows.includes(resource.resource_type) && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <div className="bg-muted/50 p-6 space-y-4 animate-accordion-down">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Resource Details:</h4>
                        <pre className="bg-background p-4 rounded-lg border text-sm overflow-x-auto whitespace-pre-wrap">
                          {resource.details}
                        </pre>
                      </div>
                      
                      <div className="bg-background rounded-lg border p-4">
                        <div className="flex items-center text-yellow-500 mb-4">
                          <Lightbulb className="h-5 w-5 mr-2" />
                          <h4 className="font-semibold text-sm">Optimization Recommendations</h4>
                        </div>
                        
                        {resource.optimization_priority && (
                          <div className="mb-4">
                            <span className="text-sm font-medium">Priority: </span>
                            <span className={cn(
                              "inline-block px-3 py-1 rounded-full text-xs font-medium",
                              resource.optimization_priority === 'high' ? 'bg-red-100 text-red-800' :
                              resource.optimization_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            )}>
                              {resource.optimization_priority.toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {resource.potential_savings && (
                          <div className="mb-4">
                            <span className="text-sm font-medium">Potential Monthly Savings: </span>
                            <span className="text-green-600 font-medium">${resource.potential_savings.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">{resource.recommendations}</p>
                        </div>
                        
                        {resource.action_items && resource.action_items.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">Recommended Actions:</h5>
                            <ul className="space-y-2">
                              {resource.action_items.map((action, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span>{action}</span>
                                </li>
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
    </div>
  );
}