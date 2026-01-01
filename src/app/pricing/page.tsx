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

  const goToLogin = () => {
    // Send user to login and bounce back to full subscribe flow afterwards
    const next = encodeURIComponent("/subscribe?selected=silver");
    router.push(`/login?next=${next}`);
  };

  if (!hydrated || isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="px-6 md:px-[135px] py-14">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#181818]">
              Choose your plan
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              No forms here — view plans and continue to login to subscribe.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Silver */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-[#181818]">Silver</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">
                  Yearly
                </span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#181818]">
                ₹5,999
              </div>
              <div className="text-[11px] text-gray-500">+ GST</div>
              <ul className="mt-5 space-y-2 text-sm text-gray-800">
                <li className="flex items-center gap-2">
                  <span>✔</span> Limited Photo Upload (Up to 3)
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Access to Email Address
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Access to Minimum Order Quantity (MoQ)
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Video Upload (Up to 1)
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Access to Phone Number
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Access to Business Catalog
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Unlimited Browsing
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Direct Chat
                </li>
              </ul>
              <button
                onClick={goToLogin}
                className="mt-6 w-full rounded-full bg-[#F4D300] text-[#181818] font-semibold py-2 shadow hover:bg-yellow-400"
              >
                Subscribe (login required)
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
