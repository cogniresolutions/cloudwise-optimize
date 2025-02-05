export interface ResourceType {
  resource_type: string;
  count: number;
  usage_percentage: number;
  cost: number | null;
  details?: string;
  recommendations?: string;
  potential_savings?: number;
  optimization_priority?: 'high' | 'medium' | 'low';
  action_items?: string[];
}