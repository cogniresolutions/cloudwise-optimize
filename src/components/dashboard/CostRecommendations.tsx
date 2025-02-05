import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Zap } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CostRecommendationsProps {
  provider: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  icon: React.ElementType;
  potential_savings?: number;
  priority?: string;
}

export function CostRecommendations({ provider }: CostRecommendationsProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session?.user) return;

      try {
        const { data: costRecommendations, error } = await supabase
          .from('cost_recommendations')
          .select('*')
          .eq('provider', provider.toLowerCase())
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedRecommendations = costRecommendations.map((rec): Recommendation => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          impact: rec.potential_savings ? `Potential savings: $${rec.potential_savings}/month` : 'Analyzing potential savings...',
          icon: getIconForPriority(rec.priority),
          potential_savings: rec.potential_savings,
          priority: rec.priority,
        }));

        setRecommendations(formattedRecommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch cost recommendations",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [session?.user, provider, toast]);

  const getIconForPriority = (priority?: string): React.ElementType => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Zap;
      default:
        return DollarSign;
    }
  };

  return (
    <Card className="col-span-4 animate-fade-in">
      <CardHeader>
        <CardTitle>Cost Optimization Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {recommendations.map((recommendation) => {
            const Icon = recommendation.icon;
            const priorityColor = recommendation.priority === 'high' 
              ? 'bg-red-100 text-red-800' 
              : recommendation.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800';

            return (
              <div
                key={recommendation.id}
                className="flex items-start space-x-4 rounded-lg border p-4"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{recommendation.title}</p>
                    {recommendation.priority && (
                      <span className={`text-xs px-2 py-1 rounded ${priorityColor}`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {recommendation.impact}
                  </p>
                </div>
              </div>
            );
          })}
          {recommendations.length === 0 && !isLoading && (
            <div className="text-center py-4 text-muted-foreground">
              No recommendations available at this time.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}