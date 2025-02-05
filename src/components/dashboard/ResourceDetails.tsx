import { AlertCircle, Lightbulb, TrendingDown } from "lucide-react";
import { ResourceType } from "./types";

interface ResourceDetailsProps {
  resource: ResourceType;
}

export function ResourceDetails({ resource }: ResourceDetailsProps) {
  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">Resource Optimization Details</h4>
        <span className={`flex items-center ${getPriorityColor(resource.optimization_priority)}`}>
          <AlertCircle className="h-4 w-4 mr-1" />
          Priority: {resource.optimization_priority || 'N/A'}
        </span>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center text-yellow-500 mb-3">
          <Lightbulb className="h-5 w-5 mr-2" />
          <p className="font-semibold">Optimization Recommendations</p>
        </div>
        <p className="text-gray-700 mb-4">{resource.recommendations}</p>
        
        {resource.potential_savings && resource.potential_savings > 0 && (
          <div className="flex items-center text-green-600 mb-3">
            <TrendingDown className="h-5 w-5 mr-2" />
            <p>
              <span className="font-semibold">Potential Monthly Savings: </span>
              ${resource.potential_savings.toFixed(2)}
            </p>
          </div>
        )}
        
        {resource.action_items && resource.action_items.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold mb-2">Recommended Actions:</p>
            <ul className="list-disc list-inside space-y-1">
              {resource.action_items.map((action, index) => (
                <li key={index} className="text-gray-700">{action}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}