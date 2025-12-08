"use client";

import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
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
  FiCheck,
} from "react-icons/fi";
import { CiCircleCheck } from "react-icons/ci";
import type { ReactElement } from "react";
import Link from "next/link";
import { blogs } from "@/data/blogs";

// Resolve backend file URLs for images served from /uploads
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
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
  const blogScrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [featureOpen, setFeatureOpen] = useState<null | "horeca" | "franchise">(
    null
  );
  const [headerBgColor, setHeaderBgColor] = useState("#1C1A1A");
  const authenticProductsRef = useRef<HTMLElement | null>(null);
  const aboutUsRef = useRef<HTMLElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    try {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  // Handle scroll to change header background color
  useEffect(() => {
    const handleScroll = () => {
      if (!authenticProductsRef.current) {
        return;
      }

      const headerHeight = 80; // Approximate header height

      // Get the Authentic Products section's position in the viewport
      const authenticProductsRect =
        authenticProductsRef.current.getBoundingClientRect();

      // Get header position (sticky header is at top of viewport, so bottom is at headerHeight)
      const headerBottom = headerHeight;

      // If Authentic Products section top is at or above the header bottom, we've scrolled past it
      // Change to light background when header's bottom scrolls past Authentic Products section top
      // Change back to dark when scrolling back up above Authentic Products section
      if (authenticProductsRect.top <= headerBottom) {
        setHeaderBgColor("#FDFDFF");
      } else {
        setHeaderBgColor("#1C1A1A");
      }
    };

    // Initial check after a delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      handleScroll();
    }, 500);

    const scrollHandler = () => {
      requestAnimationFrame(handleScroll);
    };

    const mainElement = document.getElementById("sticky-main-content");
    if (mainElement) {
      mainElement.addEventListener("scroll", scrollHandler, { passive: true });
    }
    // Also listen to window scroll as fallback
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", scrollHandler, { passive: true });

    return () => {
      clearTimeout(initTimer);
      if (mainElement) {
        mainElement.removeEventListener("scroll", scrollHandler);
      }
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("resize", scrollHandler);
    };
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
        image_url: cat.image_url,
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
    <MainLayout headerBgColor={headerBgColor} isSticky={true}>
      {/* Public Landing Hero */}
      <section
        className="dark-section overflow-hidden border-none outline-none"
        style={{
          border: "none",
          outline: "none",
          backgroundImage: "none",
          backgroundRepeat: "no-repeat",
          WebkitTextSizeAdjust: "100%",
          textSizeAdjust: "100%",
          transform: "translateZ(0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <HeroSection />
      </section>

      {/* Key Value Props */}
      <section
        ref={authenticProductsRef}
        className="dark-section font-lato !bg-[#292929] text-white py-20 overflow-hidden border-none outline-none px-6 md:px-[135px] flex flex-col"
        style={{
          height: "550px",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          backgroundImage: "none",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#1C1A1A",
          WebkitTextSizeAdjust: "100%",
          textSizeAdjust: "100%",
          transform: "translateZ(0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <h4 className="text-white text-2xl md:text-3xl font-extrabold font-lato">
          Features
        </h4>
        <div className="mx-auto h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-20 content-center mt-6">
          {/* Authentic Products */}
          <div className="flex flex-col items-start gap-4 max-w-xs">
            <div className="w-[70px] h-[70px] rounded-full bg-[#F4D300] text-[#1C1A1A] flex items-center justify-center">
              <Image
                src="/images/features/carbon_badge.svg"
                alt="Authentic Products"
                width={40}
                height={40}
              />
            </div>
            <div className="mt-6">
              <h4 className="text-white text-xl md:text-xl font-extrabold tracking-tight font-lato">
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
            <div className="w-[70px] h-[70px] rounded-full bg-[#F4D300] text-[#1C1A1A] flex items-center justify-center">
              <Image
                src="/images/features/material-symbols_verified-outline-rounded.svg"
                alt="Verified Businesses"
                width={40}
                height={40}
              />
            </div>
            <div className="mt-6">
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
            <div className="w-[70px] h-[70px] rounded-full bg-[#F4D300] text-[#1C1A1A] flex items-center justify-center">
              <Image
                src="/images/features/qlementine-icons_ui-panel-top-16.svg"
                alt="Verified Businesses"
                width={40}
                height={40}
              />
            </div>
            <div className="mt-6">
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
            <div className="w-[70px] h-[70px] rounded-full bg-[#F4D300] text-[#1C1A1A] flex items-center justify-center">
              <Image
                src="/images/features/bx_support.svg"
                alt="Dedicated Support"
                width={40}
                height={40}
              />
            </div>
            <div className="mt-6">
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

      {/* Video Section */}
      <section className="bg-[#FFFCE9] px-6 md:px-[135px] py-20 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:gap-40">
          {/* Left: Text Content */}
          <div className="flex flex-col">
            <h3 className="text-3xl md:text-5xl font-bold text-[#0B2446] mb-4 font-lato leading-18">
              Curious about how it works?
            </h3>
            <p className="text-lg md:text-lg text-[#071528] leading-7 mb-6 font-lato">
              Watch this short video to learn more and join a network of
              verified food professionals — from manufacturers to cafés — to
              source, hire, and scale your business.
            </p>
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (isVideoPlaying) {
                    videoRef.current.pause();
                    setIsVideoPlaying(false);
                  } else {
                    videoRef.current.play();
                    setIsVideoPlaying(true);
                  }
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#F4D300] text-[#1C1A1A] font-semibold text-base hover:bg-[#F6DD3D] transition-colors shadow-sm w-fit font-lato"
            >
              {isVideoPlaying ? (
                <>
                  <span>Pause</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="5"
                      y="3"
                      width="2"
                      height="10"
                      fill="currentColor"
                    />
                    <rect
                      x="9"
                      y="3"
                      width="2"
                      height="10"
                      fill="currentColor"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <span>Play</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 4L12 8L6 12V4Z" fill="currentColor" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Right: Video Player */}
          <div className="relative w-full md:max-w-[700px] h-[250px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls={isVideoPlaying}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
            >
              <source
                src="/videos/file_example_MP4_480_1_5MG.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.play();
                      setIsVideoPlaying(true);
                    }
                  }}
                  className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  aria-label="Play video"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1"
                  >
                    <path d="M8 5V19L19 12L8 5Z" fill="#181818" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Us (auto slider) */}
      {false && (
        <section
          ref={aboutUsRef}
          className="bg-[#FFFCE9] px-6 md:px-[135px] py-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-between rounded-2xl py-8">
            <div className="mr-auto">
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
            <div className="relative h-[220px] mr-0 md:h-[260px] flex text-right">
              <Image
                src={aboutSlides[aboutIdx].image}
                alt={aboutSlides[aboutIdx].title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories */}
      <section className="px-6 py-20 md:px-[135px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-[42px] font-bold text-[#363530] font-lato">
            Explore our wide range of categories
          </h3>
          <button
            onClick={() => setShowAllCategories(true)}
            className="px-5 py-2 rounded-4xl bg-[#F4D300] text-[#1C1A1A] font-semibold text-sm hover:bg-[#F6DD3D] transition-colors shadow-sm font-lato"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-9">
          {mappedCategories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/products-list?page=1&categoryId=${cat.id}`}
              className="bg-white rounded-xl overflow-hidden transition-shadow cursor-pointer flex flex-col border-none"
              style={{ boxShadow: "5px 5px 35px 0px #00000014" }}
            >
              <div className="relative w-full h-48 bg-gray-100">
                {cat.image_url && !imageErrors.has(cat.id) ? (
                  <Image
                    src={getFullImageUrl(cat.image_url)}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    onError={() => {
                      setImageErrors((prev) => new Set(prev).add(cat.id));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FiBox size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-[#000] mb-1 font-lato">
                  {cat.name}
                </h4>
                <p className="text-sm text-gray-600 font-lato">
                  {cat.productCount} Product{cat.productCount !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>

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

      {/* CTA Section */}
      <section className="px-6 md:px-[135px] py-10 md:py-36 bg-[#1C1A1A]">
        <div className="bg-[#FFFCE9] rounded-3xl overflow-hidden relative border border-gray-200/50 shadow-lg pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="px-16 pb-10 py-12 -mt-12">
              <h3 className="text-3xl md:text-4xl font-bold text-[#181818] mb-4 font-lato">
                Have a requirement?
              </h3>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6 font-lato">
                contact us now and get your first contact for free. from small
                businesses to large-scale enterprises, we empower food industry
                professionals & businesses with a network to source, connect,
                and grow.
              </p>
              <button
                onClick={() => {
                  // Scroll to hero section contact form
                  const heroSection = document.querySelector(
                    'section[class*="dark-section"]'
                  );
                  if (heroSection) {
                    heroSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    // Wait for scroll to complete, then focus and highlight the phone input
                    setTimeout(() => {
                      const phoneInput =
                        document.getElementById("hero-phone-input");
                      if (phoneInput) {
                        phoneInput.focus();
                        phoneInput.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        // Add highlight effect
                        phoneInput.style.transition = "all 0.3s ease";
                        phoneInput.style.boxShadow =
                          "0 0 0 3px rgba(244, 211, 0, 0.5)";
                        phoneInput.style.backgroundColor =
                          "rgba(244, 211, 0, 0.1)";
                        // Remove highlight after 3 seconds
                        setTimeout(() => {
                          if (phoneInput) {
                            phoneInput.style.boxShadow = "";
                            phoneInput.style.backgroundColor = "";
                          }
                        }, 3000);
                      }
                    }, 500);
                  }
                }}
                className="px-6 py-3 rounded-4xl bg-[#F4D300] text-[#181818] font-semibold text-base hover:bg-[#F6DD3D] transition-colors shadow-sm font-lato"
              >
                Contact us now
              </button>
            </div>

            {/* Right: Image */}
            <div className="flex w-full h-full text-right items-end justify-center md:justify-end">
              <Image
                src="/images/have_requirement.png"
                alt="Contact us"
                width={500}
                height={600}
                className="text-right"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Innovative Products */}
      <section className="px-6 md:px-[135px] py-12 mt-7">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-[#181818] font-lato">
            Innovative Products
          </h3>
          <Link
            href="/products-list"
            className="px-5 py-2 rounded-lg bg-[#F4D300] text-[#181818] font-semibold text-sm hover:bg-[#F6DD3D] transition-colors shadow-sm font-lato"
          >
            View all
          </Link>
        </div>
        {/* Horizontal scroll */}
        <div
          ref={scrollerRef}
          className="w-full overflow-x-auto overflow-y-hidden pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            overscrollBehaviorX: "contain",
            overscrollBehaviorY: "none",
          }}
          onWheel={(e) => {
            // Only handle if there's vertical scroll delta
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault();
              e.stopPropagation();

              // Debounce to prevent rapid scrolling
              if (scrollTimeoutRef.current) {
                return;
              }

              const container = e.currentTarget;
              // Smooth horizontal scroll - scroll by card width (320px) for slide effect
              const cardWidth = 320;
              const gap = 24; // gap-6 = 24px
              const scrollDistance = cardWidth + gap;

              // Determine scroll direction
              const scrollDirection = e.deltaY > 0 ? 1 : -1;

              // Scroll by one card width for smooth slide effect
              container.scrollBy({
                left: scrollDirection * scrollDistance,
                behavior: "smooth",
              });

              // Debounce: prevent scrolling for 500ms after each scroll
              scrollTimeoutRef.current = setTimeout(() => {
                scrollTimeoutRef.current = null;
              }, 500);
            }
          }}
        >
          <div
            className="flex gap-6 snap-x snap-mandatory"
            style={{ width: "max-content" }}
          >
            {topProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="snap-start shrink-0 w-[280px] md:w-[320px]"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-none overflow-hidden">
                  <div className="relative h-[200px] md:h-[220px] bg-gray-100">
                    <Image
                      src={getFullImageUrl(
                        (p.images && p.images[0]?.image_url) || p.image_url
                      )}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                    {/* Heart icon */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle favorite logic here
                      }}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white rounded-full transition-colors z-10"
                      aria-label="Add to favorites"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    {p.brand && (
                      <div className="text-xs text-gray-500 mb-1 truncate font-lato">
                        {p.brand}
                      </div>
                    )}
                    <div
                      className="text-base font-semibold text-[#181818] truncate font-lato"
                      title={p.name}
                    >
                      {p.name}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="px-6 md:px-[135px] py-10 md:pt-24 bg-[#1C1A1A] relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute overflow-hidden pointer-events-none right-0">
          <Image
            src="/images/Group 1 (3).png"
            alt=""
            width={1200}
            height={1000}
            className="opacity-100"
            style={{
              height: "100%",
            }}
          />
        </div>

        <div className="relative z-10 flex mx-auto">
          {/* Left: Text Content */}
          <div className="text-white w-1/3">
            <h3 className="text-3xl md:text-[58px] font-bold mb-4 font-lato leading-tight">
              Subscribe to your{" "}
              <span className="text-[#F4D300]">one-stop platform</span> for all
              food industry needs.
            </h3>
            <p className="text-base md:text-[20px] text-gray-300 leading-relaxed font-lato">
              From small businesses to large-scale enterprises, we empower food
              industry professionals & businesses with a network to source,
              connect, and grow.
            </p>
          </div>

          {/* Right: Pricing Card */}
          <div
            className="bg-white rounded-2xl shadow-lg p-8 mb-24 ml-[560px]"
            style={{ width: "395px", maxWidth: "100%" }}
          >
            <div className="text-3xl text-[#4E4E4E] mb-4 font-lato">
              Pricing
            </div>
            <div className="mb-6">
              <div className="text-7xl font-bold text-[#191D23] mb-1 font-lato">
                ₹5,900
              </div>
              <div className="text-sm text-gray-600 font-lato">
                /Year (incl. GST)
              </div>
            </div>
            <Link
              href="/subscribe"
              className="block w-full text-center px-6 py-3 rounded-lg bg-[#F4D300] text-[#3A3A3A] font-semibold hover:bg-[#F6DD3D] transition-colors shadow-sm mb-6 font-lato"
            >
              Subscribe
            </Link>
            <div className="space-y-3">
              {/* Silver plan features */}
              {[
                { label: "Limited Photo Upload (Up to 3)", included: true },
                { label: "Access to Email Address", included: true },
                {
                  label: "Access to Minimum Order Quantity (MoQ)",
                  included: true,
                },
                { label: "Video Upload (Up to 1)", included: true },
                { label: "Access to Phone Number", included: false },
                { label: "Access to Business Catalog", included: false },
                { label: "Unlimited Browsing", included: false },
                { label: "Direct Chat", included: false },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`mt-0.5 flex-shrink-0 size-6 rounded-full flex items-center justify-center ${
                      feature.included
                        ? "bg-[#FFF7C4] text-[#181818]"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {feature.included && <FiCheck color="#191D23" size={14} />}
                  </div>
                  <span
                    className={`text-[20px] font-lato ${
                      feature.included
                        ? "text-[#191D23]"
                        : "text-[#4E4E4E] line-through"
                    }`}
                  >
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Growth Solutions Section */}
      <section className="px-6 md:px-[135px] py-16 md:py-20 bg-[#FFFCE9]">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="max-w-[800px]">
            <h3 className="text-4xl md:text-6xl font-semibold text-[#090914] mb-4 font-lato">
              Growth Solutions
            </h3>
            <p className="text-base md:text-[20px] text-[#444444] leading-relaxed mb-6 font-lato">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
              vulputate, justo non tempor tincidunt, risus odio sollicitudin
              urna, in placerat dui leo eu nisi.
            </p>
            <div className="space-y-4 flex gap-10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CiCircleCheck color="#191D23" size={14} />
                </div>
                <p className="text-[20px] text-[#444444] font-medium font-lato">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vivamus
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CiCircleCheck className="text-green-600" size={14} />
                </div>
                <p className="text-[20px] text-[#444444] font-medium font-lato">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vivamus vulputate, justo
                </p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="flex items-center justify-end">
            <div className="relative w-full max-w-[500px] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/image 13.png"
                alt="Growth Solutions"
                width={500}
                height={500}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hire/Recruit Section */}
      <section className="px-6 md:px-[135px] py-16 md:py-20 bg-white">
        <div className="mx-auto">
          {/* Title and Description */}
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-6xl font-semibold text-[#090914] mb-4 font-lato">
              Hire/Recruit
            </h3>
            <p className="text-[20px] md:text-[20px] text-[#52525B] max-w-3xl mx-auto font-lato">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
              vulputate, justo non tempor tincidunt, risus odio sollicitudin
              urna, in placerat dui leo eu nisi.
            </p>
          </div>

          {/* Three Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#1C1A1A] rounded-2xl overflow-hidden shadow-lg p-4">
              <div className="text-white p-4 mb-6">
                <p className="text-[20px] leading-relaxed font-lato">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vivamus vulputate, justo.
                </p>
              </div>
              <div className="relative h-[300px] bg-gray-200 rounded-2xl">
                <Image
                  src="/images/Image.png"
                  alt="Hire/Recruit"
                  fill
                  className="object-cover rounded-2xl"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1C1A1A] rounded-2xl overflow-hidden shadow-lg p-4">
              <div className="text-white p-4 mb-6">
                <p className="text-[20px] leading-relaxed font-lato">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vivamus vulputate, justo.
                </p>
              </div>
              <div className="relative h-[300px] bg-gray-200 rounded-2xl">
                <Image
                  src="/images/Image (1).png"
                  alt="Hire/Recruit"
                  fill
                  className="object-cover rounded-2xl"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1C1A1A] rounded-2xl overflow-hidden shadow-lg p-4">
              <div className="text-white p-4 mb-6">
                <p className="text-[20px] leading-relaxed font-lato">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Vivamus vulputate, justo.
                </p>
              </div>
              <div className="relative h-[300px] bg-gray-200 rounded-2xl">
                <Image
                  src="/images/Image (2).png"
                  alt="Hire/Recruit"
                  fill
                  className="object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HoReCa + Distribution section (moved below discover products) */}
      {/* HoReCa + Distribution section (moved below discover products) */}
      {false && (
        <section id="b2b-b2c" ref={b2bRef} className="relative">
          <div className="absolute inset-x-0 top-0 h-40 md:h-72 bg-[#F4D300]" />

          <div className="max-w-[1200px] mx-auto flex items-center relative z-10 pt-20">
            <div className="bg-white rounded-l-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-10 py-18 flex flex-col h-full">
              <h4 className="text-4xl font-extrabold text-[#363530] mb-2">
                HoReCa
              </h4>
              <div className="text-[18px] text-[#565550] mb-2">
                (Hotel, Restaurant & Catering)
              </div>
              <p className="text-sm leading-6 text-[#191D23]">
                The ultimate destination for sourcing high‑quality, authentic
                food products! Whether you&apos;re a business looking to supply
                your shelves or a food enthusiast seeking authentic ingredients,
                FoodAdda has you covered.
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

            <Image
              src="/images/horeca-home.png"
              alt="HoReCa"
              width={470}
              height={513}
            />
          </div>

          <div>
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
      )}

      {/* Blogs & Newsletters Section */}
      <section className="pl-6 md:pl-[135px] py-16 md:py-32 bg-[#FFFCE9]">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 items-start">
          {/* Left: Blogs & Newsletters Content */}
          <div className="col-span-1">
            <h3 className="text-4xl md:text-6xl font-semibold text-[#1C1A1A] mb-4 font-lato leading-tight">
              Blogs &<br />
              <span>Newsletters</span>
            </h3>
            <p className="text-base md:text-[20px] text-[#1C1A1A] leading-relaxed mb-6 font-lato">
              Lorem ipsum dolor sit amet consectetur. Commodo felis odio
              adipiscing nisi massa adipiscing ac faucibus. Montes lacus sed
              vulputate tristique tortor tellus fermentum etiam in.
            </p>
            {/* Email Subscription */}
            <div className="relative mb-8 bg-white rounded-lg shadow-sm">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="example@example.com"
                className="w-full px-4 py-3 pr-24 rounded-lg border-none focus:outline-none font-lato placeholder:text-[#B5B5B5]"
              />
              <button
                onClick={() => {
                  // Handle newsletter subscription
                  if (newsletterEmail.trim()) {
                    // Add subscription logic here
                    setNewsletterEmail("");
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-lg bg-[#F4D300] text-[#181818] font-semibold hover:bg-[#F6DD3D] transition-colors font-lato whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
            {/* Navigation Arrows */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  blogScrollerRef.current?.scrollBy({
                    left: -340,
                    behavior: "smooth",
                  });
                }}
                className="w-10 h-10 rounded-full bg-[#F4D300] text-[#181818] flex items-center justify-center hover:bg-[#F6DD3D] transition-colors"
                aria-label="Previous blogs"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  blogScrollerRef.current?.scrollBy({
                    left: 340,
                    behavior: "smooth",
                  });
                }}
                className="w-10 h-10 rounded-full bg-[#F4D300] text-[#181818] flex items-center justify-center hover:bg-[#F6DD3D] transition-colors"
                aria-label="Next blogs"
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Right: Blog Cards - Horizontal Scroll */}
          <div
            ref={blogScrollerRef}
            className="col-span-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          >
            <div className="flex gap-6" style={{ width: "max-content" }}>
              {blogs.map((b) => (
                <Link
                  key={b.slug}
                  href={`/blog/${b.slug}`}
                  className="group shrink-0 w-[320px]"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                    {/* Image */}
                    <div className="relative h-[200px] bg-gray-200">
                      <Image
                        src={b.coverImage}
                        alt={b.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Black Content Block */}
                    <div className="bg-[#1C1A1A] p-6">
                      <h4 className="text-[#F7FAFF] font-semibold text-[27px] mb-3 font-lato line-clamp-2">
                        {b.title}
                      </h4>
                      <p className="text-[#F7FAFF] text-lg leading-relaxed mb-4 font-lato line-clamp-2">
                        {b.excerpt ||
                          "Lorem ipsum dolor sit amet consectetur. Commodo felis odio adipiscing nisi massa adipiscing ac faucibus."}
                      </p>
                      <div className="flex items-center mt-16 text-white text-sm font-medium font-lato group-hover:text-[#F4D300] transition-colors">
                        Read more
                        <FiChevronRight size={16} className="ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* <section className="px-6 md:px-[135px] my-16">
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
      </section> */}
    </MainLayout>
  );
}
