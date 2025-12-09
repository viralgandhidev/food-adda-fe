"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiClock } from "react-icons/fi";

export default function PublicPricingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-[#F4D300] flex items-center justify-center">
              <FiClock className="text-[#181818]" size={48} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#181818] mb-4">
            Coming Soon
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            We&apos;re preparing our pricing plans for you.
          </p>
          <p className="text-base text-gray-500 mb-12">
            Check back soon to explore our subscription options and choose the
            perfect plan for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 rounded-lg bg-[#F4D300] text-[#181818] font-semibold hover:bg-[#F6DD3D] transition-colors shadow-sm"
            >
              Back to Home
            </Link>
            <Link
              href="/subscribe"
              className="px-8 py-3 rounded-lg bg-white border-2 border-[#F4D300] text-[#181818] font-semibold hover:bg-[#FFF9E3] transition-colors"
            >
              View Subscribe
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* COMMENTED OUT - Original pricing page code
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PublicPricingPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const token = localStorage.getItem("token");
      const persisted = localStorage.getItem("auth-storage");
      const logged = Boolean(
        token || (persisted && JSON.parse(persisted || "null")?.token)
      );
      setIsLoggedIn(logged);
      if (logged) {
        // If already authenticated, this public pricing page should not be visible
        router.replace("/subscribe");
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, [router]);

  const goToLogin = (plan: "SILVER" | "GOLD") => {
    // Send user to login and bounce back to full subscribe flow afterwards
    const next = encodeURIComponent(
      "/subscribe?selected=" + plan.toLowerCase()
    );
    router.push(`/login?next=${next}`);
  };

  if (!hydrated || isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#181818]">
              Choose your plan
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              No forms here — view plans and continue to login to subscribe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            ... (rest of original code commented out)
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
*/
