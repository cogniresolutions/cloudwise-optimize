import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Cloud } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'auth' | 'cloud'>('auth');
  const [selectedProvider, setSelectedProvider] = useState<'aws' | 'azure' | 'gcp' | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      // First, sign out to clear any existing session
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        console.log("Login successful:", data.user);
        toast.success("Successfully logged in!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      // First, sign out to clear any existing session
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      if (data.user) {
        console.log("Signup successful:", data.user);
        setAuthStep('cloud');
        toast.success("Account created! Please connect your cloud provider.");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleCloudConnection = async (provider: 'aws' | 'azure' | 'gcp') => {
    try {
      setLoading(true);
      setSelectedProvider(provider);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Connecting cloud provider:", provider, "for user:", user.id);

      const { error } = await supabase
        .from('cloud_provider_connections')
        .insert({
          user_id: user.id,
          provider: provider,
          credentials: {}, // This will be updated with actual credentials later
          is_active: true
        });

      if (error) throw error;

      await supabase.functions.invoke('analyze-costs', {
        body: { provider, userId: user.id }
      });

      console.log("Cloud provider connected successfully");
      toast.success(`Successfully connected to ${provider.toUpperCase()}`);
      navigate("/");
    } catch (error: any) {
      console.error("Cloud connection error:", error);
      toast.error(`Failed to connect to ${provider.toUpperCase()}: ${error.message}`);
      setSelectedProvider(null);
    } finally {
      setLoading(false);
    }
  };

  if (authStep === 'cloud') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full space-y-8 p-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-foreground">
              Connect Your Cloud Provider
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Choose your cloud provider to start optimizing costs
            </p>
          </div>

          <div className="grid gap-4">
            {(['aws', 'azure', 'gcp'] as const).map((provider) => (
              <Button
                key={provider}
                onClick={() => handleCloudConnection(provider)}
                disabled={loading && selectedProvider === provider}
                className="w-full justify-start"
                variant="outline"
              >
                <Cloud className="mr-2 h-4 w-4" />
                {provider.toUpperCase()}
                {loading && selectedProvider === provider && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
              </Button>
            ))}
          </div>

          <Alert>
            <AlertDescription>
              You can always connect additional providers later from your dashboard.
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Welcome to Cloud Cost Manager
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Optimize your multi-cloud costs with AI
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-foreground"
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-foreground"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sign in
            </Button>
            <Button
              onClick={handleSignUp}
              disabled={loading}
              variant="outline"
              className="w-full"
              type="button"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}