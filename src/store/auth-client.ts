"use client";
import { create } from "zustand";
import { useEffect } from "react";

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
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  _hasHydrated: false,
  setAuth: (user, token) => {
    set({ user, token });
    // Store in localStorage for persistence
    localStorage.setItem("auth-storage", JSON.stringify({ user, token }));
  },
  clearAuth: () => {
    set({ user: null, token: null });
    // Clear from localStorage
    localStorage.removeItem("auth-storage");
  },
  setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
}));

// Custom hook to handle hydration
export const useHydrateAuth = () => {
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Load from localStorage only on client side
    try {
      const stored = localStorage.getItem("auth-storage");
      if (stored) {
        const { user, token } = JSON.parse(stored);
        setAuth(user, token);
      }
    } catch (error) {
      console.warn("Failed to load auth state from localStorage:", error);
    }
    setHasHydrated(true);
  }, [setAuth, setHasHydrated]);
};
