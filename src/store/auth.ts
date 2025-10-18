import { create } from "zustand";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: "CONSUMER" | "SELLER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    set({ user: user ?? null, token });
    try {
      // Persist in both formats for compatibility
      localStorage.setItem("token", token);
      localStorage.setItem("auth-storage", JSON.stringify({ user, token }));
    } catch {}
  },
  clearAuth: () => {
    set({ user: null, token: null });
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("auth-storage");
    } catch {}
  },
}));
