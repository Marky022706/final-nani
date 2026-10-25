import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'bpl_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    return getSystemTheme();
  });

  // Apply theme to document element
  const applyTheme = useCallback((theme: ResolvedTheme) => {
    setResolvedTheme(theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  // Update preference and persist to localStorage
  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch (e) {
      console.warn('Unable to persist theme preference to localStorage:', e);
    }

    if (pref === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(pref);
    }
  }, [applyTheme]);

  // Toggle between light and dark quickly
  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
  }, [resolvedTheme, setThemePreference]);

  // Listen to OS color scheme changes when set to 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themePreference === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (themePreference === 'system') {
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
    }

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themePreference, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        setThemePreference,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
