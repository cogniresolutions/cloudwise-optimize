import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { AlertTriangle, TrendingDown, DollarSign } from "lucide-react";

export function CostRecommendations({ provider }: { provider: string }) {
  const { user } = useAuth();

  // Fetch cost recommendations
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['costRecommendations', provider],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_recommendations')
        .select('*')
        .eq('provider', provider)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Trigger AI analysis when needed
  useEffect(() => {
    const analyzeCosts = async () => {
      try {
        // Fetch recent cost data
        const { data: costData } = await supabase
          .from('cloud_resources')
          .select('cost_data, resource_id')
          .eq('provider', provider)
          .eq('user_id', user?.id)
          .limit(10);

        if (!costData?.length) return;

        // Call the analyze-costs function
        const response = await supabase.functions.invoke('analyze-costs', {
          body: {
            costData: costData.map(d => d.cost_data),
            resourceData: {
              provider,
              resourceIds: costData.map(d => d.resource_id),
            },
          },
          headers: { 'x-user-id': user?.id },
        });

        if (response.error) throw response.error;
      } catch (error) {
        console.error('Error analyzing costs:', error);
      }
    };

    // Only analyze if we don't have recent recommendations
    if (recommendations?.length === 0) {
      analyzeCosts();
    }
  }, [provider, user?.id, recommendations]);

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Cost Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 animate-pulse bg-muted rounded" />
            <div className="h-20 animate-pulse bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Cost Optimization Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recommendations?.map((rec) => (
            <div key={rec.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {rec.priority === 'high' ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="font-semibold">{rec.title}</h3>
                </div>
                <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                  {rec.priority} priority
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
              {rec.potential_savings && (
                <div className="flex items-center space-x-1 text-sm text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>Potential savings: ${rec.potential_savings.toFixed(2)}</span>
                </div>
              )}
            </div>
          ))}
          {(!recommendations || recommendations.length === 0) && (
            <p className="text-center text-muted-foreground">
              No recommendations available yet. We'll analyze your cost data and provide insights soon.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}