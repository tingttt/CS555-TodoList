import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * Wraps any route that requires authentication.
 * - While the session check is in-flight, renders nothing (avoids flash redirect).
 * - If no user session exists, redirects to /signin and saves the intended path
 *   so the user is sent back after login.
 * - If authenticated, renders the child component normally.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking session — render nothing to avoid a flash
  if (loading) return null;

  // Not logged in — redirect to signin, preserve intended destination
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}
