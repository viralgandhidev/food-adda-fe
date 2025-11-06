"use client";
import Image from "next/image";
import Link from "next/link";
import { FiLogOut, FiChevronRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMega, setShowMega] = useState<"B2B" | "B2C" | null>(null);
  const [categoryTree, setCategoryTree] = useState<
    Array<{
      id: string;
      name: string;
      children?: Array<{ id: string; name: string; parent_id?: string | null }>;
    }>
  >([]);
  const [activeMainId, setActiveMainId] = useState<string>("");
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMega = (kind: "B2B" | "B2C") => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setShowMega(kind);
  };
  const scheduleCloseMega = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowMega(null), 180);
  };

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

  // Fetch categories for mega menu
  useEffect(() => {
    api
      .get("/categories/tree")
      .then((res) => {
        const data = (res.data?.data || []) as Array<{
          id: string;
          name: string;
          children?: Array<{
            id: string;
            name: string;
            parent_id?: string | null;
          }>;
        }>;
        setCategoryTree(data);
        if (data.length) setActiveMainId(data[0].id);
      })
      .catch(() => setCategoryTree([]));
  }, []);

  const activeMain = useMemo(
    () => categoryTree.find((m) => m.id === activeMainId),
    [categoryTree, activeMainId]
  );

  const goToProducts = (mainId?: string, subId?: string) => {
    const params = new URLSearchParams();
    if (mainId) params.set("mainCategoryId", mainId);
    if (subId) params.set("subCategoryId", subId);
    params.set("tab", "suppliers");
    router.push(`/products-list?${params.toString()}`);
    setShowMega(null);
  };

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
            <Link href="/" className="flex items-center gap-2 bg-[#1C1A1A]">
              <Image
                src="/images/circular-logo.svg"
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
              src="/circular-logo.svg"
              alt="Logo"
              width={100}
              height={100}
              className="w-16 h-16"
            />
          </Link>
          {/* Navigation */}
          <nav className="hidden md:flex gap-8 items-center relative">
            <div
              className="relative"
              onMouseEnter={() => openMega("B2B")}
              onMouseLeave={scheduleCloseMega}
            >
              {isLoggedIn ? (
                <Link
                  href="/forms/B2B"
                  className="text-[#1C1A1A] hover:text-[#F4D300] transition"
                >
                  B2B
                </Link>
              ) : (
                <span className="text-[#1C1A1A] hover:text-[#F4D300] transition cursor-pointer">
                  B2B
                </span>
              )}
            </div>
            <div
              className="relative"
              onMouseEnter={() => openMega("B2C")}
              onMouseLeave={scheduleCloseMega}
            >
              {isLoggedIn ? (
                <Link
                  href="/forms/B2C"
                  className="text-[#1C1A1A] hover:text-[#F4D300] transition"
                >
                  B2C
                </Link>
              ) : (
                <span className="text-[#1C1A1A] hover:text-[#F4D300] transition cursor-pointer">
                  B2C
                </span>
              )}
            </div>
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
            <>
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-full bg-white border border-gray-300 text-[#1C1A1A] font-semibold shadow hover:bg-gray-50 transition"
              >
                Dashboard
              </Link>
              <Link
                href="/subscribe"
                className="ml-1 px-6 py-2 rounded-full bg-[#F4D300] text-black font-semibold shadow hover:bg-yellow-400 transition"
              >
                Subscribe
              </Link>
            </>
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
      {/* Mega Menu */}
      {showMega && categoryTree.length > 0 && (
        <div
          className="hidden md:block border-t border-gray-100 shadow-2xl bg-white"
          onMouseEnter={() => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          }}
          onMouseLeave={scheduleCloseMega}
        >
          <div className="max-w-8xl mx-auto px-6 py-8 grid grid-cols-12 gap-8 max-h-[420px] overflow-hidden">
            {/* Left info */}
            <div className="col-span-3">
              <div className="text-base font-semibold text-[#0E1F35] mb-3">
                {showMega === "B2B" ? "B2B Suppliers" : "B2C Suppliers"}
              </div>
              <p className="text-xs leading-5 text-gray-700 mb-4">
                Browse structured categories. Hover a main category to see
                relevant sub categories.
              </p>
              <Link
                href="/products-list"
                className="inline-flex items-center text-xs font-semibold text-[#0E1F35] hover:underline"
              >
                Learn more <span className="ml-2">›</span>
              </Link>
            </div>
            {/* Mains */}
            <div className="col-span-5 pr-4 border-r">
              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Categories
              </div>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 overflow-auto max-h-[360px] bg-white">
                {categoryTree.map((m) => {
                  const active = activeMainId === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        className={`w-full flex items-center justify-between text-left px-4 py-3 transition ${
                          active
                            ? "bg-[#FFF7CC] text-gray-900"
                            : "hover:bg-gray-50"
                        }`}
                        onMouseEnter={() => setActiveMainId(m.id)}
                        onClick={() => goToProducts(m.id)}
                      >
                        <span className="text-sm text-gray-800 font-medium">
                          {m.name}
                        </span>
                        <FiChevronRight
                          className={`shrink-0 ${
                            active ? "text-gray-900" : "text-gray-400"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* Subs */}
            <div className="col-span-4">
              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                {activeMain?.name || "Sub categories"}
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-auto pr-2">
                {(activeMain?.children || []).map((s) => (
                  <button
                    key={s.id}
                    className="text-left px-4 py-3 rounded-md border border-gray-200 hover:border-yellow-300 hover:bg-[#FFF7CC] text-sm text-gray-800"
                    onClick={() => goToProducts(activeMainId, s.id)}
                  >
                    {s.name}
                  </button>
                ))}
                {activeMain && (activeMain.children || []).length === 0 && (
                  <div className="text-sm text-gray-700">
                    No sub categories.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
