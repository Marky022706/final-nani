import type { User } from '../types';
import { StorageService } from '../utils/storage';
import { api } from './api';

const AUTH_SESSION_KEY = 'bpl_current_user_v2';

export const authService = {
  /**
   * Whether an auth token is present locally. This is a fast, synchronous
   * check only - it does not confirm the token is still valid server-side.
   * Callers that need a verified session should confirm via api.me().
   */
  isAuthenticated(): boolean {
    return api.hasToken();
  },

  /**
   * Retrieve the cached authenticated user (set on login / after api.me()
   * resolves). Useful for a synchronous read before the session is re-verified.
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  },

  /**
   * Cache the authenticated session locally. The actual credential check and
   * token issuance happen server-side via api.login(); this only stores the
   * resulting user for fast synchronous reads (e.g. before /me re-verifies).
   */
  login(user: User, _rememberMe = true): void {
    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } catch {
      // ignore in non-browser environments
    }
    StorageService.setCurrentUser(user);
  },

  /**
   * Revoke the server-side token (best effort) and clear all local session data.
   */
  async logout(): Promise<void> {
    try {
      await api.logout();
    } catch {
      // Token may already be invalid/expired - still clear local session below.
    } finally {
      try {
        localStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        StorageService.clearCurrentUser();

        // Prevent back navigation by replacing browser history state
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (err) {
        console.error('Error during logout:', err);
      }
    }
  }
};
