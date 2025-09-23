"use client";

import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { FiBox, FiCheckCircle, FiPackage, FiUser } from "react-icons/fi";
import ProductCard from "@/components/home/ProductCard";
import type { ReactElement } from "react";
import Link from "next/link";

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
  }
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));

    api
      .get("/products/top-viewed", { params: { limit: 20 } })
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
  return (
    <MainLayout>
      {/* Public Landing Hero */}
      <section>
        <HeroSection />
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
                  className="text-2xl text-[#181818] hover:text-[#F4D300] ml-4"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {topProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={(product.price ?? undefined) as unknown as number}
              imageUrl={product.image_url}
              images={product.images}
              isVeg={product.is_veg}
              brand={product.brand}
              category={product.category_name}
            />
          ))}
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
