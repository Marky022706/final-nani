import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import type { AuthContextType } from '../types/auth';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onLogoutSuccess?: (msg: string) => void;
}> = ({ children, onLogoutSuccess }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const isLoading = false;

  // Sync state with storage on mount and popstate (prevent back navigation after logout)
  useEffect(() => {
    const handlePopState = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        setUser(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const login = (newUser: User) => {
    authService.login(newUser, true);
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const confirmLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);

    if (onLogoutSuccess) {
      onLogoutSuccess('You have been logged out successfully.');
    }
  };

  const logout = () => {
    openLogoutModal();
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    authService.login(updated, true);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        confirmLogout,
        cancelLogout,
        isLogoutModalOpen,
        openLogoutModal,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
