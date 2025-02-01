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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      toast.error("Error fetching profile");
    }
  };

  useEffect(() => {
    // Get the initial session synchronously from localStorage
    const initialSession = supabase.auth.getSession();
    if (initialSession) {
      const user = supabase.auth.user();
      if (user) {
        setUser(user);
        fetchProfile(user.id);
      }
    }
    setLoading(false);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user ?? null);
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          navigate("/");
        }
      } else {
        setUser(null);
        setProfile(null);
        if (event === 'SIGNED_OUT') {
          navigate("/auth");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
}