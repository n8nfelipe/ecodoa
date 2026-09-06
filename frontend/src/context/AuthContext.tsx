import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  phone?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));

    const refreshOnFocus = () => void refreshUser();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshUser();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
