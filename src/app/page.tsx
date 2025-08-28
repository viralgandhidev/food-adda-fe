"use client";

import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <MainLayout>
      {/* Public Landing Hero */}
      <section>
        <HeroSection />
      </section>

      {/* Public Categories Showcase (static placeholders pulled from existing component defaults) */}
      <section className="px-6 md:px-12 mt-10">
        <CategoriesSection categories={[]} />
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 my-16">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#181818] mb-2">
              Join FoodAdda
            </h2>
            <p className="text-gray-600">
              Sign up to explore products, suppliers and more.
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link
              href="/login"
              className="px-6 py-3 rounded-full bg-[#FFD600] text-[#181818] font-semibold shadow hover:bg-yellow-400 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 rounded-full bg-white border border-[#FFD600] text-[#181818] font-semibold shadow hover:bg-[#FFF9E3] transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
