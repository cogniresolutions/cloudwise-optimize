import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
    }
  }, [user, loading, navigate, location]);

  // If we're on the auth page and loading, show spinner
  if (loading && location.pathname === '/auth') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If we're on the auth page, don't require authentication
  if (location.pathname === '/auth') {
    return <>{children}</>;
  }

  // For protected routes, show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // For all other routes, require authentication
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;