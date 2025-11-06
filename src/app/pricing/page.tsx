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
            {/* Silver */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-[#181818]">Silver</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">
                  Monthly
                </span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#181818]">
                ₹5,900
              </div>
              <div className="text-[11px] text-gray-500">Inclusive of GST</div>
              <ul className="mt-5 space-y-2 text-sm text-gray-800">
                <li className="flex items-center gap-2">
                  <span>✔</span> Email visibility for suppliers
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Create products
                </li>
                <li className="flex items-center gap-2">
                  <span>◻</span> Phone visibility
                </li>
                <li className="flex items-center gap-2">
                  <span>◻</span> Unlimited extra photos (up to 3 instead)
                </li>
              </ul>
              <button
                onClick={() => goToLogin("SILVER")}
                className="mt-6 w-full rounded-full bg-[#F4D300] text-[#181818] font-semibold py-2 shadow hover:bg-yellow-400"
              >
                Subscribe (login required)
              </button>
            </div>

            {/* Gold */}
            <div className="rounded-2xl border border-yellow-300 bg-white shadow-sm p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-[#181818]">Gold</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-900">
                  Monthly
                </span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#181818]">
                ₹10,620
              </div>
              <div className="text-[11px] text-gray-500">Inclusive of GST</div>
              <ul className="mt-5 space-y-2 text-sm text-gray-800">
                <li className="flex items-center gap-2">
                  <span>✔</span> Email visibility for suppliers
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Phone visibility for suppliers
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Create products
                </li>
                <li className="flex items-center gap-2">
                  <span>✔</span> Unlimited extra photos
                </li>
              </ul>
              <button
                onClick={() => goToLogin("GOLD")}
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
