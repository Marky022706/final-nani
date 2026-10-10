import type { User } from './index';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  confirmLogout: () => void;
  cancelLogout: () => void;
  isLogoutModalOpen: boolean;
  openLogoutModal: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}
