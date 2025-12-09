"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiClock } from "react-icons/fi";

export default function SubscribePage() {
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
            We&apos;re working hard to bring you an amazing subscription
            experience.
          </p>
          <p className="text-base text-gray-500 mb-12">
            Stay tuned! We&apos;ll be launching our subscription plans very
            soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 rounded-lg bg-[#F4D300] text-[#181818] font-semibold hover:bg-[#F6DD3D] transition-colors shadow-sm"
            >
              Back to Home
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 rounded-lg bg-white border-2 border-[#F4D300] text-[#181818] font-semibold hover:bg-[#FFF9E3] transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* COMMENTED OUT - Original subscribe page code
"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { api, apiMultipart } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiCheck, FiX } from "react-icons/fi";
import { useAuthStore } from "@/store/auth";
import {
  textInputClass,
  selectClass,
  fileInputClass,
  textAreaClass,
} from "@/components/forms/fieldClasses";

... (rest of original code commented out)
*/
