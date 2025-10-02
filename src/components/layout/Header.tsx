"use client";
import Image from "next/image";
import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Hydration guard
    setHydrated(true);

    // Read auth state from localStorage
    const readAuth = () => {
      try {
        const token = localStorage.getItem("token");
        // Also support older persisted store if present
        const persisted = localStorage.getItem("auth-storage");
        if (token) {
          setIsLoggedIn(true);
          return;
        }
        if (persisted) {
          const parsed = JSON.parse(persisted);
          setIsLoggedIn(Boolean(parsed?.token));
          return;
        }
        setIsLoggedIn(false);
      } catch {
        setIsLoggedIn(false);
      }
    };

    readAuth();

    // Keep in sync across tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "auth-storage") {
        readAuth();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("auth-storage");
    } catch {}
    setIsLoggedIn(false);
    router.replace("/login");
  };

  if (!hydrated) {
    return (
      <header className="bg-[#FDFDFF] w-full py-3 shadow-sm">
        <div className="max-w-8xl mx-auto flex items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-1.png"
                alt="Logo"
                width={100}
                height={100}
                className="w-16 h-16"
              />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#FDFDFF] w-full py-3 shadow-sm">
      <div className="max-w-8xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-1.png"
              alt="Logo"
              width={100}
              height={100}
              className="w-16 h-16"
            />
          </Link>
          {/* Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            {isLoggedIn ? (
              <Link
                href="/forms/B2B"
                className="text-[#1C1A1A] hover:text-[#F4D300] transition"
              >
                B2B
              </Link>
            ) : (
              <Link
                href="/#b2b-b2c"
                className="text-[#1C1A1A] hover:text-[#F4D300] transition"
              >
                B2B
              </Link>
            )}
            {isLoggedIn ? (
              <Link
                href="/forms/B2C"
                className="text-[#1C1A1A] hover:text-[#F4D300] transition"
              >
                B2C
              </Link>
            ) : (
              <Link
                href="/#b2b-b2c"
                className="text-[#1C1A1A] hover:text-[#F4D300] transition"
              >
                B2C
              </Link>
            )}
            <Link
              href="/forms/HoReCa"
              className="text-[#1C1A1A] hover:text-[#F4D300] transition"
            >
              HoReCa
            </Link>
            <Link
              href="/forms/Franchise"
              className="text-[#1C1A1A] hover:text-[#F4D300] transition"
            >
              Franchise
            </Link>
            <Link
              href="/forms/Recruitments"
              className="text-[#1C1A1A] hover:text-[#F4D300] transition"
            >
              Recruitments
            </Link>
            <Link
              href="/forms/Quote-Request"
              className="text-[#1C1A1A] hover:text-[#F4D300] transition"
            >
              Quote Request
            </Link>
          </nav>
        </div>
        {/* Dynamic Auth Buttons */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <Link
              href="#"
              className="ml-6 px-6 py-2 rounded-full bg-[#F4D300] text-black font-semibold shadow hover:bg-yellow-400 transition"
            >
              Subscribe
            </Link>
          )}

          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#F4D300] text-[#1C1A1A] font-semibold shadow hover:bg-[#FFF9E3] transition"
              title="Logout"
            >
              <FiLogOut size={20} />
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 rounded-full bg-white border border-[#F4D300] text-[#1C1A1A] font-semibold shadow hover:bg-[#FFF9E3] transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-full bg-[#F4D300] text-[#1C1A1A] font-semibold shadow hover:bg-yellow-400 transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
