"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // If token is not in store, try to rehydrate from localStorage
    if (!token) {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("auth-storage")
          : null;
      if (storedToken) {
        try {
          const parsed = JSON.parse(storedToken).state;
          if (parsed && parsed.token) {
            setAuth(parsed.user, parsed.token);
            return;
          }
        } catch {
          // ignore parse errors
        }
      }
      router.replace("/login");
    }
  }, [token, router, setAuth]);

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
