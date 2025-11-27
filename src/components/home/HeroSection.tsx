"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";

const slides = [
  "/images/slides/slide1.jpg",
  "/images/slides/slide2.jpg",
  "/images/slides/slide3.jpg",
];

interface Country {
  code: string;
  name: string;
  dialCode: string;
  maxLength: number;
}

// Helper function to get flag image URL from country code
const getFlagUrl = (countryCode: string): string => {
  return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
};

const countries: Country[] = [
  { code: "IN", name: "India", dialCode: "+91", maxLength: 10 },
  { code: "US", name: "United States", dialCode: "+1", maxLength: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", maxLength: 9 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", maxLength: 10 },
  { code: "SG", name: "Singapore", dialCode: "+65", maxLength: 8 },
  { code: "AU", name: "Australia", dialCode: "+61", maxLength: 9 },
  { code: "CA", name: "Canada", dialCode: "+1", maxLength: 10 },
  { code: "DE", name: "Germany", dialCode: "+49", maxLength: 11 },
  { code: "FR", name: "France", dialCode: "+33", maxLength: 9 },
  { code: "IT", name: "Italy", dialCode: "+39", maxLength: 10 },
  { code: "ES", name: "Spain", dialCode: "+34", maxLength: 9 },
  { code: "NL", name: "Netherlands", dialCode: "+31", maxLength: 9 },
  { code: "BE", name: "Belgium", dialCode: "+32", maxLength: 9 },
  { code: "CH", name: "Switzerland", dialCode: "+41", maxLength: 9 },
  { code: "AT", name: "Austria", dialCode: "+43", maxLength: 10 },
  { code: "SE", name: "Sweden", dialCode: "+46", maxLength: 9 },
  { code: "NO", name: "Norway", dialCode: "+47", maxLength: 8 },
  { code: "DK", name: "Denmark", dialCode: "+45", maxLength: 8 },
  { code: "FI", name: "Finland", dialCode: "+358", maxLength: 9 },
  { code: "PL", name: "Poland", dialCode: "+48", maxLength: 9 },
  { code: "PT", name: "Portugal", dialCode: "+351", maxLength: 9 },
  { code: "GR", name: "Greece", dialCode: "+30", maxLength: 10 },
  { code: "IE", name: "Ireland", dialCode: "+353", maxLength: 9 },
  { code: "NZ", name: "New Zealand", dialCode: "+64", maxLength: 9 },
  { code: "ZA", name: "South Africa", dialCode: "+27", maxLength: 9 },
  { code: "BR", name: "Brazil", dialCode: "+55", maxLength: 11 },
  { code: "MX", name: "Mexico", dialCode: "+52", maxLength: 10 },
  { code: "AR", name: "Argentina", dialCode: "+54", maxLength: 10 },
  { code: "CL", name: "Chile", dialCode: "+56", maxLength: 9 },
  { code: "CO", name: "Colombia", dialCode: "+57", maxLength: 10 },
  { code: "PE", name: "Peru", dialCode: "+51", maxLength: 9 },
  { code: "CN", name: "China", dialCode: "+86", maxLength: 11 },
  { code: "JP", name: "Japan", dialCode: "+81", maxLength: 10 },
  { code: "KR", name: "South Korea", dialCode: "+82", maxLength: 10 },
  { code: "TH", name: "Thailand", dialCode: "+66", maxLength: 9 },
  { code: "MY", name: "Malaysia", dialCode: "+60", maxLength: 9 },
  { code: "ID", name: "Indonesia", dialCode: "+62", maxLength: 10 },
  { code: "PH", name: "Philippines", dialCode: "+63", maxLength: 10 },
  { code: "VN", name: "Vietnam", dialCode: "+84", maxLength: 10 },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", maxLength: 9 },
  { code: "KW", name: "Kuwait", dialCode: "+965", maxLength: 8 },
  { code: "QA", name: "Qatar", dialCode: "+974", maxLength: 8 },
  { code: "OM", name: "Oman", dialCode: "+968", maxLength: 8 },
  { code: "BH", name: "Bahrain", dialCode: "+973", maxLength: 8 },
  { code: "JO", name: "Jordan", dialCode: "+962", maxLength: 9 },
  { code: "LB", name: "Lebanon", dialCode: "+961", maxLength: 8 },
  { code: "EG", name: "Egypt", dialCode: "+20", maxLength: 10 },
  { code: "TR", name: "Turkey", dialCode: "+90", maxLength: 10 },
  { code: "IL", name: "Israel", dialCode: "+972", maxLength: 9 },
  { code: "RU", name: "Russia", dialCode: "+7", maxLength: 10 },
];

export default function HeroSection() {
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [currentSlide, setCurrentSlide] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Force repaint on mount to fix rendering artifacts
  useEffect(() => {
    if (sectionRef.current) {
      // Force a repaint by triggering a reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      sectionRef.current.offsetHeight;
      // Force a repaint after a brief delay
      const timer = setTimeout(() => {
        if (sectionRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          sectionRef.current.offsetHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };

    if (isCountryDropdownOpen) {
      // Use a small delay to avoid closing immediately when opening
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  // Slideshow auto-advance
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const fullPhoneNumber = `${selectedCountry.dialCode}${phone.trim()}`;
      await api.post("/forms/contact", { phone: fullPhoneNumber });
      setSubmitStatus("success");
      setPhone("");
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
    setPhone(""); // Reset phone when country changes
  };

  return (
    <section
      ref={sectionRef}
      className="dark-section relative flex pt-6 overflow-hidden border-none outline-none lg:px-[135px] px-6"
      style={{
        minHeight: "calc(645px)",
        boxSizing: "border-box",
        backgroundColor: "#1C1A1A",
        border: "none",
        outline: "none",
        backgroundImage: "none",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "initial",
        backgroundSize: "initial",
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
        transform: "translateZ(0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div className="relative z-10 w-full flex justify-between">
        {/* Left Content */}
        <div className="flex-1 gap-10 pt-32 max-w-2xl">
          <h1 className="text-4xl leading-tight 2xl:text-5xl font-bold text-white mb-6">
            India’s{" "}
            <span className="text-[#F4D300]">first business platform</span>{" "}
            built exclusively for the food industry
          </h1>
          <p className="text-[#B1B1B1] mb-14">
            Join a network of verified food professionals — from manufacturers
            to cafés — to source, hire, and scale your business.
          </p>
          <div className="relative max-w-xl" style={{ overflow: "visible" }}>
            <form
              onSubmit={handleSubmit}
              className="flex bg-white rounded-lg shadow-lg"
              style={{ overflow: "visible" }}
            >
              <div className="relative z-10" ref={countryDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCountryDropdownOpen(!isCountryDropdownOpen);
                  }}
                  className="flex items-center px-3 py-3.5 border-r border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Image
                    src={getFlagUrl(selectedCountry.code)}
                    alt={selectedCountry.name}
                    width={20}
                    height={15}
                    className="object-cover rounded-sm"
                    style={{ width: "20px", height: "15px" }}
                    unoptimized
                  />
                  <span className="ml-1.5 text-gray-700 font-medium text-sm">
                    {selectedCountry.dialCode}
                  </span>
                  <svg
                    className={`ml-1.5 w-3.5 h-3.5 text-gray-500 transition-transform ${
                      isCountryDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {/* Dropdown positioned absolutely relative to button */}
                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] max-h-80 overflow-y-auto w-64">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCountrySelect(country);
                        }}
                        className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition ${
                          selectedCountry.code === country.code
                            ? "bg-yellow-50"
                            : ""
                        }`}
                      >
                        <Image
                          src={getFlagUrl(country.code)}
                          alt={country.name}
                          width={24}
                          height={18}
                          className="object-cover rounded-sm mr-3"
                          style={{ width: "24px", height: "18px" }}
                          unoptimized
                        />
                        <span className="flex-1 text-left text-gray-700 font-medium">
                          {country.name}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {country.dialCode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= selectedCountry.maxLength) {
                    setPhone(value);
                    setSubmitStatus("idle");
                  }
                }}
                type="tel"
                placeholder="Enter your phone number"
                className="flex-1 px-4 py-2.5 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-base font-medium border-none"
                maxLength={selectedCountry.maxLength}
              />
              <button
                type="submit"
                disabled={isSubmitting || !phone.trim()}
                className="flex items-center gap-1.5 px-6 py-2.5 m-1.5 bg-[#F4D300] disabled:bg-[#F4D300]/90 text-black font-bold text-sm rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ minWidth: 130 }}
              >
                {isSubmitting ? "Sending..." : "Let's Connect"}
              </button>
            </form>
            {submitStatus === "success" && (
              <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
                Thank you! We&apos;ll connect with you soon.
              </div>
            )}
            {submitStatus === "error" && (
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                {phone.trim()
                  ? "Something went wrong. Please try again."
                  : "Please enter a valid phone number."}
              </div>
            )}
          </div>
        </div>

        {/* Right iPhone with Slideshow */}
        <div className="hidden lg:flex items-end justify-end shrink-0 relative place-content-end">
          <div
            className="relative flex justify-end"
            style={{
              height: "900px",
              width: "580px",
              maxWidth: "650px",
              overflow: "hidden",
              position: "relative",
              isolation: "isolate",
              transform: "scale(0.73)",
              transformOrigin: "right bottom",
              marginTop: "-150px",
            }}
          >
            {/* Slideshow inside iPhone screen - positioned behind phone frame */}
            <div
              className="absolute z-[5]"
              style={{
                top: "42.42px",
                right: "42px",
                width: "490.17px",
                height: "902.11px",
                borderRadius: "0",
                overflow: "hidden",
                margin: "0",
                padding: "0",
              }}
            >
              <div
                className="relative w-full h-full"
                style={{ overflow: "hidden", margin: "0", padding: "0" }}
              >
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute transition-opacity duration-1000 ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      margin: "0",
                      padding: "0",
                    }}
                  >
                    <Image
                      src={slide}
                      alt={`Slide ${index + 1}`}
                      fill
                      className="object-cover"
                      style={{
                        objectPosition: "left top",
                        margin: "0",
                        padding: "0",
                      }}
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* iPhone SVG - on top to show frame */}
            <div
              className="absolute z-10 top-0 right-0"
              style={{ pointerEvents: "none", width: "750px", height: "945px" }}
            >
              <Image
                src="/images/iPhone.svg"
                alt="iPhone"
                width={499.375}
                height={827.084}
                className="w-full h-full"
                priority
                style={{ objectFit: "contain", objectPosition: "top right" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
