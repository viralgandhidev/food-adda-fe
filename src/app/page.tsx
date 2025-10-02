"use client";

import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import {
  FiBox,
  FiCheckCircle,
  FiPackage,
  FiUser,
  FiAward,
  FiShield,
  FiLayers,
  FiHeadphones,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import type { ReactElement } from "react";
import Link from "next/link";
import { blogs } from "@/data/blogs";

// Resolve backend file URLs for images served from /uploads
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");
const getFullImageUrl = (imageUrl?: string) => {
  if (imageUrl && imageUrl.startsWith("/uploads/")) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }
  return imageUrl || "/images/default-product.jpg";
};

interface CategoryApi {
  id: string;
  name: string;
  image_url?: string;
  product_count: number;
}

export default function LandingPage() {
  const [categories, setCategories] = useState<CategoryApi[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  interface TopProduct {
    id: string;
    name: string;
    description: string;
    price: number | null;
    image_url?: string;
    images?: Array<{ id: string; image_url: string; order: number }>;
    is_veg: boolean;
    brand?: string;
    category_name?: string;
    category_id?: string;
  }
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [featureOpen, setFeatureOpen] = useState<null | "horeca" | "franchise">(
    null
  );
  useEffect(() => {
    try {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  // About slides
  const aboutSlides = useMemo(
    () => [
      {
        eyebrow: "About us",
        title: "One–Stop Portal",
        body: [
          "The ultimate destination for sourcing high‑quality, authentic food products! Whether you’re a business looking to supply your shelves or a food enthusiast seeking authentic ingredients for your next recipe, FoodAdda has you covered.",
        ],
        image: "/images/about-one-stop.png",
      },
      {
        eyebrow: "What we offer",
        title: "B2B • B2C • HoReCa",
        body: [
          "B2B: Reliable, affordable sourcing through verified suppliers — find everything related to food in one place.",
          "B2C: A simple portal experience to explore spices, snacks, staples and ready‑to‑eat items; built to scale with subscriptions.",
          "HoReCa: Tailored for hospitality, restaurants and cafés with professional‑grade products and dependable fulfillment.",
        ],
        image: "/images/hero-bg.jpg",
      },
      {
        eyebrow: "Why choose FoodAdda",
        title: "Authentic • Compliant • Supported",
        body: [
          "Authentic Products and Verified Companies ensure trust and quality.",
          "Fixed subscription plans keep procurement simple and predictable.",
          "Seamless sourcing experience with accurate product info and dedicated support.",
        ],
        image: "/images/default-product.jpg",
      },
    ],
    []
  );
  const [aboutIdx, setAboutIdx] = useState(0);
  // Learn More copy blocks (replace with your doc text)
  const horecaLearnMore: string[] = useMemo(
    () => [
      "Tailored procurement for Hotels, Restaurants and Catering with curated, compliance‑ready products.",
      "Bulk pricing from verified suppliers, consistent quality and assured availability.",
      "Dedicated support for discovery, sampling and delivery scheduling across cities.",
    ],
    []
  );
  const franchiseLearnMore: string[] = useMemo(
    () => [
      "A scalable distribution & franchise program to expand your brand fast and compliantly.",
      "End‑to‑end onboarding, supply chain assistance and marketing toolkits to start quickly.",
      "Flexible formats – kiosk, store‑in‑store or flagship – with training and ongoing support.",
    ],
    []
  );
  useEffect(() => {
    const id = setInterval(() => {
      setAboutIdx((i) => (i + 1) % aboutSlides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [aboutSlides.length]);
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));

    api
      .get("/products/top-viewed", { params: { limit: 8 } })
      .then((res) => setTopProducts(res.data?.data || []))
      .catch(() => setTopProducts([]));
  }, []);

  const categoryDescriptions: Record<string, string> = useMemo(
    () => ({
      "Raw Materials": "Sourcing essentials for your culinary creations.",
      "Packaging Solutions": "From innovative materials to machinery.",
      "Ready to Eat & Cook": "A variety of veg and non-veg options.",
      "Kitchen Equipments":
        "Tools for every kitchen, from home to commercial setups.",
      "Food Consultants & Chefs": "Expertise to elevate your food business.",
      "Regulatory Consultants & Food Testing Labs":
        "Ensuring safety and compliance.",
    }),
    []
  );

  const categoryIcons: Record<string, ReactElement> = useMemo(
    () => ({
      "Raw Materials": <FiPackage size={28} />,
      "Packaging Solutions": <FiBox size={28} />,
      "Ready to Eat & Cook": <FiBox size={28} />,
      "Kitchen Equipments": <FiBox size={28} />,
      "Food Consultants & Chefs": <FiUser size={28} />,
      "Regulatory Consultants & Food Testing Labs": <FiCheckCircle size={28} />,
    }),
    []
  );

  const mappedCategories = useMemo(
    () =>
      categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description:
          categoryDescriptions[cat.name] || "Category description...",
        icon: categoryIcons[cat.name] || <FiBox size={28} />,
        productCount: cat.product_count,
      })),
    [categories, categoryDescriptions, categoryIcons]
  );
  // Scroll to B2B/B2C section when URL hash is present
  const b2bRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#b2b-b2c" && b2bRef.current) {
      b2bRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <MainLayout>
      {/* Public Landing Hero */}
      <section>
        <HeroSection />
      </section>

      {/* Key Value Props */}
      <section className="bg-[#1C1A1A] text-white py-24">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-20 px-6 md:px-12">
          {/* Authentic Products */}
          <div className="flex flex-col items-start gap-4 max-w-xs">
            <div className="w-14 h-14 rounded-full bg-[#F6DD3D] text-[#1C1A1A] flex items-center justify-center">
              <FiAward size={22} />
            </div>
            <div>
              <h4 className="text-white text-xl md:text-xl font-extrabold tracking-tight">
                Authentic Products
              </h4>
              <p className="text-sm text-[#B1B0B0] leading-6 mt-2">
                Access a curated selection of trusted brands featuring authentic
                Indian and international products.
              </p>
            </div>
          </div>

          {/* Verified Businesses */}
          <div className="flex flex-col items-start gap-4 max-w-xs">
            <div className="w-14 h-14 rounded-full bg-[#F6DD3D] text-[#1C1A1A] flex items-center justify-center">
              <FiShield size={22} />
            </div>
            <div>
              <h4 className="text-white text-xl md:text-xl font-extrabold tracking-tight">
                Verified Businesses
              </h4>
              <p className="text-sm text-[#B1B0B0] leading-6 mt-2">
                Only companies with complete statutory compliance are listed,
                ensuring reliability and quality.
              </p>
            </div>
          </div>

          {/* Seamless Sourcing Experience */}
          <div className="flex flex-col items-start gap-4 max-w-xs">
            <div className="w-14 h-14 rounded-full bg-[#F6DD3D] text-[#1C1A1A] flex items-center justify-center">
              <FiLayers size={22} />
            </div>
            <div>
              <h4 className="text-white text-xl md:text-xl font-extrabold tracking-tight">
                Seamless Sourcing Experience
              </h4>
              <p className="text-sm text-[#B1B0B0] leading-6 mt-2">
                Intuitive, user‑friendly interface with easy navigation and
                accurate product information.
              </p>
            </div>
          </div>

          {/* Dedicated Support */}
          <div className="flex flex-col items-start gap-4 max-w-xs">
            <div className="w-14 h-14 rounded-full bg-[#F6DD3D] text-[#1C1A1A] flex items-center justify-center">
              <FiHeadphones size={22} />
            </div>
            <div>
              <h4 className="text-white text-xl md:text-xl font-extrabold tracking-tight">
                Dedicated Support
              </h4>
              <p className="text-sm text-[#B1B0B0] leading-6 mt-2">
                Our customer service team is here to assist you with inquiries
                or special requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us (auto slider) */}
      <section className="px-6 md:px-12 mt-12">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-10 bg-white rounded-2xl p-8">
          {/* Text */}
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
              {aboutSlides[aboutIdx].eyebrow}
            </div>
            <h3 className="text-3xl font-extrabold text-[#181818] mb-3">
              {aboutSlides[aboutIdx].title}
            </h3>
            <div className="space-y-3 text-sm leading-6 text-gray-700">
              {aboutSlides[aboutIdx].body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {/* Dots */}
            <div className="flex items-center gap-2 mt-6">
              {aboutSlides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setAboutIdx(i)}
                  className={
                    i === aboutIdx
                      ? "w-16 h-[6px] rounded-full bg-[#181818]"
                      : "w-10 h-[6px] rounded-full bg-gray-300 hover:bg-gray-400"
                  }
                />
              ))}
            </div>
          </div>
          {/* Illustration */}
          <div className="relative h-[220px] md:h-[260px]">
            <Image
              src={aboutSlides[aboutIdx].image}
              alt={aboutSlides[aboutIdx].title}
              fill
              className="object-contain"
            />
          </div>
        </div>
      </section>

      {/* Featured Categories (same style as dashboard) */}
      <section className="px-6 md:px-12 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#181818]">
            Featured Categories
          </h3>
          <button
            onClick={() => setShowAllCategories(true)}
            className="text-sm text-gray-600 hover:text-[#181818]"
          >
            View all
          </button>
        </div>
        <CategoriesSection compact categories={mappedCategories} />

        {showAllCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative max-h-[80vh] flex flex-col">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-8 py-5 border-b border-gray-200 rounded-t-2xl">
                <h3 className="text-2xl font-bold text-[#181818]">
                  All Categories
                </h3>
                <button
                  className="text-2xl text-[#181818] hover:text-[#F6DD3D] ml-4"
                  onClick={() => setShowAllCategories(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              {/* List */}
              <div className="overflow-y-auto px-2 py-4 flex-1">
                {mappedCategories.map((cat, idx) => (
                  <Link
                    key={cat.id}
                    href={`/products-list?page=1&categoryId=${cat.id}`}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors rounded-lg hover:bg-gray-50 cursor-pointer ${
                      idx !== mappedCategories.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                    onClick={() => setShowAllCategories(false)}
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF7C2] text-[#F4D300] text-xl shrink-0">
                      {cat.icon}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span
                        className="font-semibold text-base text-[#181818] leading-tight truncate overflow-hidden whitespace-nowrap max-w-[180px]"
                        title={cat.name}
                      >
                        {cat.name}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#F4D300] text-[#181818] font-semibold px-3 py-1 rounded-full text-xs w-fit mt-1 shadow-sm">
                        {cat.productCount} Product
                        {cat.productCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Top Viewed Products */}
      <section className="px-6 md:px-12 mt-10 mb-16">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#181818]">
            Discover new products across categories
          </h3>
          <Link href="/products-list" className="text-sm text-gray-600">
            View all
          </Link>
        </div>
        {/* Horizontal slider */}
        <div className="relative">
          {/* Arrows */}
          <button
            aria-label="Prev"
            className="hidden md:flex absolute -left-5 top-[120px] z-20 w-10 h-10 items-center justify-center rounded-full bg-[#F6DD3D] text-[#1C1A1A] shadow-lg ring-1 ring-yellow-300 hover:scale-105 transition"
            onClick={() =>
              scrollerRef.current?.scrollBy({ left: -320, behavior: "smooth" })
            }
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            aria-label="Next"
            className="hidden md:flex absolute -right-5 top-[120px] z-20 w-10 h-10 items-center justify-center rounded-full bg-[#F6DD3D] text-[#1C1A1A] shadow-lg ring-1 ring-yellow-300 hover:scale-105 transition"
            onClick={() =>
              scrollerRef.current?.scrollBy({ left: 320, behavior: "smooth" })
            }
          >
            <FiChevronRight size={18} />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          >
            {topProducts.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[320px]">
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-3">
                    <span className="truncate max-w-[70%]">
                      {p.category_name || ""}
                    </span>
                    <Link
                      href={`/products-list?categoryId=${p.category_id ?? ""}`}
                      className="text-gray-500 hover:text-[#181818]"
                    >
                      View More
                    </Link>
                  </div>
                  <div className="group relative h-[190px] rounded-lg overflow-hidden">
                    <Image
                      src={getFullImageUrl(
                        (p.images && p.images[0]?.image_url) || p.image_url
                      )}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4">
                    {p.brand && (
                      <div className="text-[11px] text-gray-500 underline mb-1 truncate">
                        {p.brand}
                      </div>
                    )}
                    <div
                      className="text-sm text-gray-700 truncate"
                      title={p.name}
                    >
                      {p.name}
                    </div>
                    <div
                      className={`mt-2 font-bold ${
                        !isLoggedIn ? "filter blur select-none" : ""
                      }`}
                    >
                      {(() => {
                        const n =
                          typeof p.price === "number"
                            ? p.price
                            : typeof (p.price as unknown) === "string"
                            ? Number(p.price as unknown as string)
                            : NaN;
                        return Number.isFinite(n)
                          ? `₹${n.toLocaleString()}`
                          : "₹—";
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HoReCa + Distribution section (moved below discover products) */}
      <section
        id="b2b-b2c"
        ref={b2bRef}
        className="relative px-6 md:px-12 mt-8"
      >
        {/* yellow band behind first card */}
        <div className="absolute inset-x-0 top-0 h-40 md:h-72 bg-[#F4D300]" />

        <div className="max-w-[1200px] mx-auto flex items-center relative z-10 pt-20">
          {/* HoReCa card */}
          <div className="bg-white rounded-l-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-10 py-18 flex flex-col h-full">
            <h4 className="text-4xl font-extrabold text-[#363530] mb-2">
              HoReCa
            </h4>
            <div className="text-[18px] text-[#565550] mb-2">
              (Hotel, Restaurant & Catering)
            </div>
            <p className="text-sm leading-6 text-[#191D23]">
              The ultimate destination for sourcing high‑quality, authentic food
              products! Whether you’re a business looking to supply your shelves
              or a food enthusiast seeking authentic ingredients, FoodAdda has
              you covered.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() =>
                  setFeatureOpen(featureOpen === "horeca" ? null : "horeca")
                }
                className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#F6DD3D] text-[#181818] text-[12px] font-semibold shadow hover:brightness-95"
              >
                {featureOpen === "horeca" ? "Hide" : "Learn More"}
              </button>
            </div>
            {featureOpen === "horeca" && (
              <div className="mt-4 rounded-xl bg-[#FFF9D6] border border-[#F4D300]/50 p-4 text-sm text-[#181818] space-y-2">
                <div className="text-xs uppercase tracking-wide text-[#6B6A66]">
                  HoReCa • Learn more
                </div>
                <h5 className="text-base font-extrabold text-[#181818]">
                  Designed for hospitality
                </h5>
                {horecaLearnMore.map((p, i) => (
                  <p key={`horeca-inline-${i}`}>{p}</p>
                ))}
              </div>
            )}
          </div>

          {/* Image placeholder (user will replace later) */}
          <Image
            src="/images/horeca-home.png"
            alt="HoReCa"
            width={470}
            height={513}
          />
        </div>

        {/* Franchise banner */}
        <div className="-mx-6 md:-mx-12">
          <div
            className="mt-12 relative z-10 overflow-hidden bg-center bg-cover h-[320px] md:h-[420px] rounded-none"
            style={{ backgroundImage: "url('/images/franchise-home.png')" }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center text-white gap-3 px-6">
              <h4 className="text-3xl md:text-4xl font-extrabold">
                Distribution & Franchise
              </h4>
              <p className="text-sm md:text-base text-gray-200">
                Expand your brand effortlessly with a proven franchise model.
              </p>
              <button
                onClick={() =>
                  setFeatureOpen(
                    featureOpen === "franchise" ? null : "franchise"
                  )
                }
                className="mt-2 inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#F6DD3D] text-[#181818] text-sm font-semibold shadow hover:brightness-95"
              >
                {featureOpen === "franchise" ? "Hide" : "Learn More"}
              </button>
              {featureOpen === "franchise" && (
                <div className="mt-3 max-w-2xl w-full bg-black/30 rounded-xl p-4 text-sm text-gray-100 space-y-2">
                  <div className="text-xs uppercase tracking-wide text-gray-300">
                    Distribution & Franchise • Learn more
                  </div>
                  <h5 className="text-base font-extrabold text-white">
                    Grow with a proven model
                  </h5>
                  {franchiseLearnMore.map((p, i) => (
                    <p key={`fr-inline-${i}`}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Read our Blogs */}
      <section className="px-6 md:px-12 mt-10">
        <div className="max-w-[1200px] mx-auto">
          <h3 className="text-lg font-semibold text-[#181818] mb-4">
            Read our Blogs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.slice(0, 6).map((b) => (
              <Link key={b.slug} href={`/blog/${b.slug}`} className="group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="relative h-[150px]">
                    <Image
                      src={b.coverImage}
                      alt={b.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="px-4 pt-3 pb-5">
                    <div className="text-[10px] text-gray-500 mb-1">
                      {b.author} | {b.date}
                    </div>
                    <div className="font-semibold text-[#181818] truncate">
                      {b.title}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {b.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
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
              className="px-6 py-3 rounded-full bg-[#F4D300] text-[#181818] font-semibold shadow hover:bg-yellow-400 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 rounded-full bg-white border border-[#F4D300] text-[#181818] font-semibold shadow hover:bg-[#FFF9E3] transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
