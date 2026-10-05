import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { operatorMe, loginOperator, logoutOperator } from "./api";

interface AuthContextType {
  isOperator: boolean;
  loading: boolean;
  login: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
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

  const login = useCallback(async (pin: string) => {
    await loginOperator(pin);
    setIsOperator(true);
  }, []);

  const logout = useCallback(async () => {
    await logoutOperator();
    setIsOperator(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isOperator, loading, login, logout }}>
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
