import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  current?: boolean;
  onClick?: () => void;
}

interface BreadcrumbContextType {
  subTrail: BreadcrumbItem[];
  setSubTrail: (items: BreadcrumbItem[]) => void;
  clearSubTrail: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  subTrail: [],
  setSubTrail: () => {},
  clearSubTrail: () => {}
});

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subTrail, setSubTrailState] = useState<BreadcrumbItem[]>([]);

  const setSubTrail = useCallback((items: BreadcrumbItem[]) => {
    setSubTrailState(items);
  }, []);

  const clearSubTrail = useCallback(() => {
    setSubTrailState([]);
  }, []);

  const value = useMemo(
    () => ({
      subTrail,
      setSubTrail,
      clearSubTrail
    }),
    [subTrail, setSubTrail, clearSubTrail]
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbs = () => useContext(BreadcrumbContext);
