import { createContext, useContext, useState, ReactNode } from 'react';

interface Org {
  id: string;
  name: string;
}

interface OrgContextValue {
  org: Org | null;
  setOrg: (org: Org | null) => void;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Org | null>(null);
  return (
    <OrgContext.Provider value={{ org, setOrg }}>{children}</OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
