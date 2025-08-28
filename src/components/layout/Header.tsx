"use client";
import Image from "next/image";
import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function Header() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const onLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <header className="bg-[#FFFEF7] w-full py-4 shadow-sm">
      <div className="max-w-8xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
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
          <Link
            href="/forms/B2B"
            className="text-[#1C1A1A] hover:text-[#FFD600] transition"
          >
            B2B
          </Link>
          <Link
            href="/forms/B2C"
            className="text-[#1C1A1A] hover:text-[#FFD600] transition"
          >
            B2C
          </Link>
          <Link
            href="/forms/HoReCa"
            className="text-[#1C1A1A] hover:text-[#FFD600] transition"
          >
            HoReCa
          </Link>
          <Link
            href="/forms/Franchise"
            className="text-[#1C1A1A] hover:text-[#FFD600] transition"
          >
            Franchise
          </Link>
          <Link
            href="/forms/Recruitments"
            className="text-[#1C1A1A] hover:text-[#FFD600] transition"
          >
            Recruitments
          </Link>
          <Link
            href="/forms/Quote-Request"
            className="text-[#1C1A1A] hover:text-[#FFD600] transition"
          >
            Quote Request
          </Link>
        </nav>
        {/* Subscribe & Logout Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="ml-6 px-6 py-2 rounded-full bg-[#FFD600] text-black font-semibold shadow hover:bg-yellow-400 transition"
          >
            Subscribe
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#FFD600] text-[#1C1A1A] font-semibold shadow hover:bg-[#FFF9E3] transition"
            title="Logout"
          >
            <FiLogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
