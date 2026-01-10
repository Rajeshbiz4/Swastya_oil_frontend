import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchProfile } from '../../store/slices/authSlice';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, user, token, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    // If we have a token but no user, fetch the profile
    if (token && !user && !isLoading) {
      dispatch(fetchProfile());
    }
  }, [token, user, isLoading, dispatch]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Required roles: {requiredRoles.join(', ')}</p>
        <p>Your role: {user.role}</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;