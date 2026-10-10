import React from 'react';
import type { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback || null}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', margin: '24px' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Your account role ({user.role}) does not have permission to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
