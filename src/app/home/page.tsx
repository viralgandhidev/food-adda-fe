"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/home/ProductCard";
import HeroSection from "@/components/home/HeroSection";
import { api } from "@/lib/api";
import { FiBox, FiCheckCircle, FiPackage, FiUser } from "react-icons/fi";
import { ReactNode } from "react";
import CategoriesSection from "@/components/home/CategoriesSection";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";

interface Category {
  id: string;
  name: string;
  image_url: string;
  product_count: number;
}

interface ProductImage {
  id: string;
  image_url: string;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  preparation_time: number;
  rating: number;
  is_veg: boolean;
  images?: ProductImage[];
  brand?: string;
  category_name: string;
}

const categoryDescriptions: Record<string, string> = {
  "Raw Materials": "Sourcing essentials for your culinary creations.",
  "Packaging Solutions": "From innovative materials to machinery.",
  "Ready to Eat & Cook": "A variety of veg and non-veg options.",
  "Kitchen Equipments":
    "Tools for every kitchen, from home to commercial setups.",
  "Food Consultants & Chefs": "Expertise to elevate your food business.",
  "Regulatory Consultants & Food Testing Labs":
    "Ensuring safety and compliance.",
};

const categoryIcons: Record<string, ReactNode> = {
  "Raw Materials": <FiPackage size={28} />,
  "Packaging Solutions": <FiBox size={28} />,
  "Ready to Eat & Cook": <FiBox size={28} />,
  "Kitchen Equipments": <FiBox size={28} />,
  "Food Consultants & Chefs": <FiUser size={28} />,
  "Regulatory Consultants & Food Testing Labs": <FiCheckCircle size={28} />,
};

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const user = useAuthStore((state) => state.user);
  const isSeller = user?.user_type === "SELLER";

  // Navigate to dashboard but keep rendering content as fallback
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = isSeller
          ? await api.get("/products/seller/products")
          : await api.get("/products");
        setProducts(productsRes.data.data);

        const categoriesRes = await api.get("/categories");
        setCategories(categoriesRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [isSeller]);

  const mappedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: categoryDescriptions[cat.name] || "Category description...",
    icon: categoryIcons[cat.name] || <FiBox size={28} />,
    productCount: cat.product_count,
  }));

  return (
    <ProtectedRoute>
      <MainLayout>
        {/* Dashboard-like header cards */}
        <section className="px-6 md:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              "Profile Views",
              "Engagement",
              "Enquiries",
              "Products Viewed",
            ].map((label, idx) => (
              <div
                key={label}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
              >
                <div className="text-xs text-gray-500">{label}</div>
                <div className="mt-2 text-2xl font-bold text-[#181818]">
                  {idx === 0 ? 100 : idx === 1 ? 15 : idx === 2 ? 5 : 2}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick panels */}
        <section className="px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Your Products",
                cta: "+ Create",
                href: "/products/create",
              },
              {
                title: "Saved Products",
                cta: "Browse",
                href: "/products-list",
              },
              { title: "Saved Businesses", cta: "Explore", href: "/seller/" },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col justify-between"
              >
                <div className="text-sm text-gray-500">{card.title}</div>
                <div className="self-end">
                  <Link
                    href={card.href}
                    className="px-4 py-2 rounded-full bg-[#FFD600] text-[#181818] font-semibold shadow hover:bg-yellow-400 transition"
                  >
                    {card.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Categories */}
        <section className="px-6 md:px-12 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#181818]">
              Featured Categories
            </h3>
            <Link href="/products-list" className="text-sm text-gray-600">
              View all
            </Link>
          </div>
          <CategoriesSection categories={mappedCategories} />
        </section>

        {/* Suggested Businesses (placeholder cards) */}
        <section className="px-6 md:px-12 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#181818]">
              Suggested Businesses
            </h3>
            <Link href="/seller/1" className="text-sm text-gray-600">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-100 border border-gray-200 rounded-2xl shadow-sm"
              />
            ))}
          </div>
        </section>

        {/* Browse Products - reuse existing ProductCard */}
        <section className="px-6 md:px-12 mt-10 mb-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#181818]">
              Browse Products
            </h3>
            <Link href="/products-list" className="text-sm text-gray-600">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                imageUrl={product.image_url}
                images={product.images}
                isVeg={product.is_veg}
                brand={product.brand}
                category={product.category_name}
              />
            ))}
          </div>
        </section>
      </MainLayout>
    </ProtectedRoute>
  );
}
