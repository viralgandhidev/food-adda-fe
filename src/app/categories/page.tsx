"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import { FiBox } from "react-icons/fi";
import Link from "next/link";
import { memo } from "react";

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
  parent_id?: string | null;
}

// Mapping of category names to local image files
const categoryImageMap: Record<string, string> = {
  "Training, Skill Development & Manpower": "/images/categories/training.png",
  "Consultancy & Advisory Services": "/images/categories/consultancy.png",
  "Branding, Marketing & Design": "/images/categories/branding.png",
  "Food Testing": "/images/categories/food-testing.png",
  "Indian Snacks": "/images/categories/indian-snacks.png",
  "Agri Farm Supplies": "/images/categories/agri-farm-supplies.png",
  Machinery: "/images/categories/machinery.png",
  "Cold Chains": "/images/categories/cold-chains.png",
  "Packaging & Allied Products": "/images/categories/allied-products.png",
  "HoReCa & Institutional Supplies": "/images/categories/horeca.png",
  "Food Ingredients & Additives": "/images/categories/food-ingredients.png",
  "Health, Organic & Specialty Foods": "/images/categories/health.png",
  "Packaged & Processed Foods": "/images/categories/packaged.png",
  Bakery: "/images/categories/bakery.png",
  "Bakery, Confectionery & Snacks": "/images/categories/bakery.png",
  "Oils, Fats & Spices": "/images/categories/oils.png",
  Beverages: "/images/categories/beverages.png",
  "Meat, Poultry & Seafood": "/images/categories/meat.png",
  "Dairy & Dairy Alternatives": "/images/categories/dairy.png",
  "Grains, Pulses & Cereals": "/images/categories/grains.png",
  "Fresh Produce": "/images/categories/fresh-produce.png",
  "Cold Chain & Logistics": "/images/categories/cold-chains.png",
  "Food Processing & Machinery": "/images/categories/machinery.png",
  "Agri & Farm Supplies": "/images/categories/agri-farm-supplies.png",
  "Indian Snacks & Sweets": "/images/categories/indian-snacks.png",
  "Food Testing & Certification": "/images/categories/food-testing.png",
};

// Memoized category card component
const CategoryCard = memo(
  ({
    category,
    hasImageError,
    onImageError,
  }: {
    category: {
      id: string;
      name: string;
      image_url?: string;
      productCount: number;
    };
    hasImageError: boolean;
    onImageError: (id: string) => void;
  }) => (
    <Link
      href={`/products-list?page=1&categoryId=${category.id}`}
      className="bg-white rounded-xl overflow-hidden transition-shadow cursor-pointer flex flex-col border-none hover:shadow-lg"
      style={{ boxShadow: "5px 5px 35px 0px #00000014" }}
    >
      <div className="relative w-full h-48 bg-gray-100">
        {category.image_url && !hasImageError ? (
          <Image
            src={
              category.image_url.startsWith("/images/")
                ? category.image_url
                : getFullImageUrl(category.image_url)
            }
            alt={category.name}
            fill
            className="object-cover"
            onError={() => onImageError(category.id)}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <FiBox size={48} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-6">
        <h4 className="text-lg font-bold text-[#000] mb-1 font-lato">
          {category.name}
        </h4>
        <p className="text-sm text-gray-600 font-lato">
          {category.productCount} Product
          {category.productCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  )
);
CategoryCard.displayName = "CategoryCard";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryApi[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    api
      .get("/categories")
      .then((res) => {
        if (cancelled) return;
        const allCategories = res.data?.data || [];
        // Filter out sub-categories (categories with parent_id)
        const mainCategories = allCategories.filter(
          (cat: CategoryApi) => !cat.parent_id
        );
        // Only update state if data actually changed (compare by IDs)
        setCategories((prev) => {
          const prevIds = prev
            .map((c: CategoryApi) => c.id)
            .sort()
            .join(",");
          const newIds = mainCategories
            .map((c: CategoryApi) => c.id)
            .sort()
            .join(",");
          if (prevIds === newIds) return prev;
          return mainCategories;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setCategories((prev) => (prev.length === 0 ? prev : []));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Memoize the image error handler
  const handleImageError = useCallback((categoryId: string) => {
    setImageErrors((prev) => {
      if (prev.has(categoryId)) return prev;
      const newSet = new Set(prev);
      newSet.add(categoryId);
      return newSet;
    });
  }, []);

  const mappedCategories = useMemo(() => {
    if (categories.length === 0) return [];

    return categories.map((cat) => {
      // Use local image if available, otherwise fall back to API image_url
      const localImage = categoryImageMap[cat.name];
      const imageUrl = localImage || cat.image_url;

      return {
        id: cat.id,
        name: cat.name,
        productCount: cat.product_count,
        image_url: imageUrl,
      };
    });
  }, [categories]);

  return (
    <MainLayout>
      <section className="px-6 py-20 md:px-[135px]">
        <div className="mb-8">
          <h1 className="text-3xl md:text-[42px] font-bold text-[#363530] font-lato mb-2">
            All Categories
          </h1>
          <p className="text-gray-600 text-lg">
            Explore our wide range of food industry categories
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-9">
          {mappedCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              hasImageError={imageErrors.has(cat.id)}
              onImageError={handleImageError}
            />
          ))}
        </div>
        {mappedCategories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p>No categories available at the moment.</p>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
