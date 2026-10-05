import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  operatorMe,
  loginOperator,
  logoutOperator,
  clearOperatorToken,
  isUnauthorized,
} from "./api";

interface AuthContextType {
  isOperator: boolean;
  loading: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  resetSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOperator, setIsOperator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    operatorMe().then((ok) => {
      if (!cancelled) {
        setIsOperator(ok);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetSession = useCallback(() => {
    clearOperatorToken();
    setIsOperator(false);
  }, []);

  const login = useCallback(async (pin: string) => {
    await loginOperator(pin);
    setIsOperator(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutOperator();
    } finally {
      setIsOperator(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isOperator, loading, login, logout, resetSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/** Wrap operator API calls: 401 → clear token + flip UI to PIN login. */
export function useRequireAuth() {
  const { resetSession } = useAuth();
  return useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (isUnauthorized(err)) {
          resetSession();
        }
        throw err;
      }
    },
    [resetSession]
  );
}
