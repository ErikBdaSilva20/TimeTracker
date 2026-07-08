// PROTECTED — auth wrapper over the MasIA gateway. Do not edit as app code.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { auth, type Me, type Role } from "./data/client";

interface AuthContextValue extends Me {
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Me>({ user: null, role: null });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await auth.me();
      setState(me);
    } catch {
      setState({ user: null, role: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value: AuthContextValue = {
    ...state,
    loading,
    refresh,
    signIn: async (email, password) => {
      await auth.signIn(email, password);
      await refresh();
    },
    signUp: async (email, password, name) => {
      await auth.signUp(email, password, name);
      await refresh();
    },
    signOut: async () => {
      await auth.signOut();
      setState({ user: null, role: null });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

const RANK: Record<string, number> = { rep: 1, manager: 2, admin: 3, owner: 3 };
export function roleAtLeast(role: Role | string | null, min: Role): boolean {
  if (!role) return false;
  return (RANK[role] ?? 0) >= (RANK[min] ?? 0);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Gates a route behind a minimum role. The real authorization boundary is
 * always the gateway (`owner_id`) — this is a second, UI-level guard so a
 * `rep` can't reach manager-only screens (team/reports/analytics/settings)
 * by navigating to the URL directly, even if the sidebar already hides the
 * link (audit 5.1).
 */
export function RequireRole({ min, children }: { min: Role; children: ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!roleAtLeast(role, min)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
