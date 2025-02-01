import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!loading && !user && location.pathname !== '/auth') {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
    }
  }, [user, loading, navigate, location]);

  // Show loading spinner only during initial load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For the auth page, don't require authentication
  if (location.pathname === '/auth') {
    return <>{children}</>;
  }

  // For all other routes, require authentication
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;