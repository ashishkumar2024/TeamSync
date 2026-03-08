import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setAuth: (user: User | null, accessToken: string | null, refreshToken?: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('teamsync_auth');
    if (stored) {
      const parsed = JSON.parse(stored) as { user: User; accessToken: string; refreshToken?: string };
      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
    }
    setLoading(false);
  }, []);

  const setAuth = (nextUser: User | null, nextToken: string | null, refreshToken?: string | null) => {
    setUser(nextUser);
    setAccessToken(nextToken);
    if (nextUser && nextToken) {
      const stored: { user: User; accessToken: string; refreshToken?: string } = {
        user: nextUser,
        accessToken: nextToken,
      };
      if (refreshToken) stored.refreshToken = refreshToken;
      localStorage.setItem('teamsync_auth', JSON.stringify(stored));
    } else {
      localStorage.removeItem('teamsync_auth');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isAuthenticated: !!user && !!accessToken, loading, setAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

