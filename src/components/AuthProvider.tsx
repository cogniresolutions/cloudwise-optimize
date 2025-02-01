import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, profile: null });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        throw error;
      }
      
      console.log("Profile data:", data);
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        console.log("Initializing session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          throw error;
        }

        if (mounted) {
          if (session?.user) {
            console.log("Found existing session for user:", session.user.email);
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            console.log("No existing session found");
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (mounted) {
          setLoading(false);
          toast.error("Failed to initialize session");
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, session?.user?.email ?? "no user");
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          console.log("User signed in, redirecting to home");
          navigate("/");
        }
      } else {
        setUser(null);
        setProfile(null);
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, redirecting to auth");
          navigate("/auth");
        }
      }
    });

    return () => {
      console.log("Cleaning up auth provider");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
}