"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If token is not in store, try to rehydrate from localStorage
    if (!token) {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("auth-storage")
          : null;
      if (storedToken) {
        try {
          const parsedAny = JSON.parse(storedToken);
          const state = parsedAny?.state || parsedAny; // support both shapes
          if (state && state.token) {
            setAuth(state.user, state.token);
            setChecking(false);
            return;
          }
        } catch {
          // ignore parse errors
        }
      }
      // Fallback to independent token key
      const looseToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (looseToken) {
        setAuth(user as any, looseToken);
        setChecking(false);
        return;
      }
      router.replace("/login");
      setChecking(false);
    } else {
      setChecking(false);
    }
  }, [token, router, setAuth]);

  if (checking) return <div className="p-6" />;
  if (!token) return null;

  return <>{children}</>;
}
