import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { GlobalPageLoader } from '../components/common/GlobalPageLoader';

export const DESTINATION_LABELS: Record<string, string> = {
  dashboard: 'Overview & Operations Dashboard',
  books: 'Library Book Catalog & Inventory',
  members: 'Patron & Member Directory',
  archive: 'Archived Holdings & Collections',
  attendance: 'Daily Attendance & Service Log',
  services: 'Municipal Public Services',
  circulation: 'Circulation Desk — Borrowing & Returns',
  notifications: 'Notifications & Alerts',
  history: 'Circulation & Activity History',
  reports: 'Statistical Reports & Analytics',
  admin_mgmt: 'Staff & Access Management',
  audit_logs: 'System Security & Audit Trail',
  system_settings: 'System Configuration & Settings',
  my_books: 'My Borrowed Books & Active Loans',
  reservations: 'My Book Reservations & Holds',
  profile: 'Patron Profile & Security',
  help_support: 'Library Directory & Help',
  login: 'Staff & Member Sign In',
  landing: 'Public Library Portal'
};

export interface PageTransitionOptions {
  title?: string;
  subtitle?: string;
  thresholdMs?: number;
  minHoldMs?: number;
  destinationLabel?: string;
}

export interface PageTransitionContextType {
  isTransitioning: boolean;
  targetDestination: string | null;
  transitionError: string | null;
  startTransition: (
    dest: string,
    executeNav: () => void | Promise<void>,
    options?: PageTransitionOptions
  ) => Promise<void>;
  dismissTransition: () => void;
  retryTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [targetDestination, setTargetDestination] = useState<string | null>(null);
  const [title, setTitle] = useState('Loading Library System...');
  const [subtitle, setSubtitle] = useState('Please wait while we prepare your page.');
  const [destinationLabel, setDestinationLabel] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const transitionIdRef = useRef(0);
  const isNavigatingRef = useRef(false);
  const activeDestRef = useRef<string | null>(null);
  const lastActionRef = useRef<(() => void) | null>(null);

  // Active timers
  const thresholdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up all active timers on unmount
  useEffect(() => {
    return () => {
      if (thresholdTimerRef.current) clearTimeout(thresholdTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, []);

  const dismissTransition = useCallback(() => {
    transitionIdRef.current += 1;
    if (thresholdTimerRef.current) clearTimeout(thresholdTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);

    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      isNavigatingRef.current = false;
      activeDestRef.current = null;
      setTargetDestination(null);
      setError(null);
    }, 180);
  }, []);

  const startTransition = useCallback(
    async (
      dest: string,
      executeNav: () => void | Promise<void>,
      options?: PageTransitionOptions
    ) => {
      // Prevent duplicate transitions to the same destination already in flight
      if (isNavigatingRef.current && activeDestRef.current === dest) {
        return;
      }

      // Increment transition ID to cancel any prior asynchronous transition
      transitionIdRef.current += 1;
      const currentTransitionId = transitionIdRef.current;

      // Clear any prior timers
      if (thresholdTimerRef.current) {
        clearTimeout(thresholdTimerRef.current);
        thresholdTimerRef.current = null;
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }

      isNavigatingRef.current = true;
      activeDestRef.current = dest;
      setError(null);
      setTargetDestination(dest);

      const label = options?.destinationLabel || DESTINATION_LABELS[dest] || dest;
      setDestinationLabel(label);
      setTitle(options?.title || 'Loading Library System...');
      setSubtitle(options?.subtitle || 'Please wait while we prepare your page.');

      lastActionRef.current = () => {
        startTransition(dest, executeNav, options);
      };

      // Configurable threshold: default 450ms delay so fast page navigations do not flash an annoying spinner.
      // The loading animation only appears if the transition is genuinely delayed (>450ms).
      const thresholdMs = options?.thresholdMs ?? 450;
      const minHoldMs = options?.minHoldMs ?? 200;

      let hasShownOverlay = false;
      let displayStartTime = 0;

      if (thresholdMs === 0) {
        hasShownOverlay = true;
        displayStartTime = performance.now();
        setIsExiting(false);
        setIsVisible(true);
      } else {
        // Start the threshold timer
        thresholdTimerRef.current = setTimeout(() => {
          if (transitionIdRef.current === currentTransitionId && isNavigatingRef.current) {
            hasShownOverlay = true;
            displayStartTime = performance.now();
            setIsExiting(false);
            setIsVisible(true);
          }
        }, thresholdMs);
      }

      // Watchdog timer: 8 seconds maximum before displaying recoverable error state
      watchdogTimerRef.current = setTimeout(() => {
        if (transitionIdRef.current === currentTransitionId && isNavigatingRef.current) {
          setError('Navigation took longer than expected. Please check your connection or try again.');
          setIsVisible(true);
          setIsExiting(false);
        }
      }, 8000);

      try {
        await executeNav();

        // If a subsequent transition has started, yield control to it
        if (transitionIdRef.current !== currentTransitionId) {
          return;
        }

        // Clear threshold and watchdog
        if (thresholdTimerRef.current) {
          clearTimeout(thresholdTimerRef.current);
          thresholdTimerRef.current = null;
        }
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }

        // Case 1: Route completed BEFORE the threshold elapsed
        // The overlay was never shown -> complete immediately with ZERO delay!
        if (!hasShownOverlay) {
          isNavigatingRef.current = false;
          activeDestRef.current = null;
          setTargetDestination(null);
          return;
        }

        // Case 2: The overlay was shown -> prevent 1-frame blink with minimal visual hold
        const elapsedSinceVisible = performance.now() - displayStartTime;
        const remainingHold = Math.max(0, minHoldMs - elapsedSinceVisible);

        if (remainingHold > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingHold));
        }

        if (transitionIdRef.current !== currentTransitionId) {
          return;
        }

        // Smooth fade-out exit
        setIsExiting(true);
        exitTimerRef.current = setTimeout(() => {
          if (transitionIdRef.current === currentTransitionId) {
            setIsVisible(false);
            setIsExiting(false);
            isNavigatingRef.current = false;
            activeDestRef.current = null;
            setTargetDestination(null);
          }
        }, 180);
      } catch (err: unknown) {
        if (transitionIdRef.current !== currentTransitionId) {
          return;
        }
        if (thresholdTimerRef.current) {
          clearTimeout(thresholdTimerRef.current);
          thresholdTimerRef.current = null;
        }
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }
        const message = err instanceof Error ? err.message : 'An error occurred while loading this page.';
        setError(message);
        setIsVisible(true);
        setIsExiting(false);
      }
    },
    []
  );

  const retryTransition = useCallback(() => {
    setError(null);
    if (lastActionRef.current) {
      lastActionRef.current();
    } else {
      dismissTransition();
    }
  }, [dismissTransition]);

  return (
    <PageTransitionContext.Provider
      value={{
        isTransitioning: isVisible,
        targetDestination,
        transitionError: error,
        startTransition,
        dismissTransition,
        retryTransition
      }}
    >
      {children}
      <GlobalPageLoader
        isVisible={isVisible}
        isExiting={isExiting}
        title={title}
        subtitle={subtitle}
        destinationName={destinationLabel}
        error={error}
        onRetry={retryTransition}
        onDismiss={dismissTransition}
      />
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = (): PageTransitionContextType => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};
