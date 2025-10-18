"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/home/ProductCard";
import { api } from "@/lib/api";
import { authService } from "@/services/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");

function getFullImageUrl(imageUrl?: string) {
  if (imageUrl?.startsWith("/uploads/")) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }
  return imageUrl || "/images/default-product.jpg";
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

export default function DashboardPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [savedProductsAll, setSavedProductsAll] = useState<Product[]>([]);
  interface SavedSupplier {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    company_description?: string;
    profile_image_url?: string;
  }
  const [savedSuppliers, setSavedSuppliers] = useState<SavedSupplier[]>([]);
  const [savedSuppliersAll, setSavedSuppliersAll] = useState<SavedSupplier[]>(
    []
  );
  const [showSavedProductsModal, setShowSavedProductsModal] = useState(false);
  const [showSavedSuppliersModal, setShowSavedSuppliersModal] = useState(false);
  const [metrics, setMetrics] = useState({
    profileViews: 0,
    engagement: 0,
    enquiries: 0,
    productsViewed: 0,
  });
  // Global search (same behavior as home hero)
  type ProductSuggestion = {
    id: string;
    name: string;
    image_url?: string;
    price?: number | null;
  };
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((state) => state.user);
  const isSeller = false; // Dashboard shows generic latest products only

  useEffect(() => {
    const onPullToRefresh = () => {
      (async () => {
        try {
          const latestRes = await api.get("/products", {
            params: { sortBy: "updated_at", sortOrder: "desc", limit: 20 },
          });
          setProducts(latestRes.data.data);
          toast.success("Refreshed");
        } catch {}
      })();
    };
    window.addEventListener("ptr", onPullToRefresh);
    return () => window.removeEventListener("ptr", onPullToRefresh);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const latestRes = await api.get("/products", {
          params: { sortBy: "updated_at", sortOrder: "desc", limit: 20 },
        });
        setProducts(latestRes.data.data);

        const categoriesRes = await api.get("/categories");
        setCategories(categoriesRes.data.data);

        if (user?.id) {
          const metricsRes = await api.get(`/suppliers/${user.id}/metrics`);
          setMetrics(metricsRes.data.data);
        }

        // Fetch user's own products (if any) and keep only latest 5 on dashboard
        try {
          const mineRes = await api.get("/products/seller/products");
          const items: Product[] = mineRes.data.data || [];
          // Sort by updated_at if present (string ISO), otherwise keep as-is
          const sorted = [...items].sort((a, b) => {
            const aTime =
              (a as unknown as { updated_at?: string })?.updated_at ?? "";
            const bTime =
              (b as unknown as { updated_at?: string })?.updated_at ?? "";
            return bTime.localeCompare(aTime);
          });
          setMyProducts(sorted.slice(0, 5));
        } catch {
          // Ignore if not a seller or endpoint not accessible
          setMyProducts([]);
        }

        // Saved lists (all users)
        try {
          const [sp, ss]: [Product[], SavedSupplier[]] = await Promise.all([
            authService.listSavedProducts(),
            authService.listSavedSuppliers(),
          ]);
          setSavedProductsAll(sp || []);
          setSavedSuppliersAll(ss || []);
          setSavedProducts((sp || []).slice(0, 5));
          setSavedSuppliers((ss || []).slice(0, 5));
        } catch {
          setSavedProducts([]);
          setSavedSuppliers([]);
          setSavedProductsAll([]);
          setSavedSuppliersAll([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [isSeller, user?.id]);

  // Debounced suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get("/products", {
          params: { q: query, limit: 5 },
        });
        const items = (res.data?.data || []) as Array<{
          id: string;
          name: string;
          image_url?: string;
          price?: number | null;
        }>;
        setSuggestions(
          items.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.name,
            image_url: p.image_url,
            price: p.price ?? null,
          }))
        );
        setOpen(true);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/products-list?${params.toString()}`);
  };

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
        {/* KPI cards */}
        <section className="px-6 md:px-12 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Views */}
            <div className="relative overflow-hidden rounded-2xl border border-yellow-100 bg-white shadow-sm p-6 flex items-center gap-5">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-yellow-100/80 flex items-center justify-center ring-1 ring-yellow-200">
                {/* Eye icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-yellow-600 fill-current"
                >
                  <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-500">
                  Profile Views
                </div>
                <div className="mt-1 text-4xl font-extrabold text-[#181818] leading-none">
                  {metrics.profileViews}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Unique profile views recorded today
                </div>
              </div>
              <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-yellow-50" />
            </div>

            {/* Products Viewed */}
            <div className="relative overflow-hidden rounded-2xl border border-yellow-100 bg-white shadow-sm p-6 flex items-center gap-5">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-yellow-100/80 flex items-center justify-center ring-1 ring-yellow-200">
                {/* Package icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-yellow-600 fill-current"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM11 20l-7-4V8l7 4Zm2 0V12l7-4v8Z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-500">
                  Products Viewed
                </div>
                <div className="mt-1 text-4xl font-extrabold text-[#181818] leading-none">
                  {metrics.productsViewed}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Total product views associated with your listings
                </div>
              </div>
              <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-yellow-50" />
            </div>
          </div>
        </section>

        {/* Quick panels */}
        <section className="px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your Products (list view) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[180px] h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-700">
                  Your Products
                </div>
                <Link
                  href={user?.id ? `/seller/${user.id}` : "/seller"}
                  className="text-xs font-semibold text-gray-700 hover:text-[#181818]"
                >
                  View all
                </Link>
              </div>

              {myProducts.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {myProducts.map((p) => (
                    <li key={p.id} className="py-2 flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={getFullImageUrl(p.image_url)}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-[#181818] truncate"
                          title={p.name}
                        >
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ₹{p.price?.toLocaleString?.() || p.price}
                        </div>
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        className="text-xs font-semibold text-[#181818] hover:underline"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 mb-4">
                  You have not added any products yet.
                </div>
              )}

              <div className="mt-auto self-end">
                <Link
                  href="/products/create"
                  className="px-4 py-2 rounded-full bg-[#F4D300] text-[#181818] font-semibold shadow hover:bg-yellow-400 transition"
                >
                  + Create
                </Link>
              </div>
            </div>

            {/* Saved Products */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-700">
                  Saved Products
                </div>
                <button
                  onClick={() => setShowSavedProductsModal(true)}
                  className="text-xs font-semibold text-gray-700 hover:text-[#181818]"
                >
                  View all
                </button>
              </div>
              {savedProducts.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {savedProducts.map((p) => (
                    <li key={p.id} className="py-2 flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={getFullImageUrl(p.image_url)}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-[#181818] truncate"
                          title={p.name}
                        >
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ₹{p.price?.toLocaleString?.() || p.price}
                        </div>
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        className="text-xs font-semibold text-[#181818] hover:underline"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No saved products.</div>
              )}
            </div>

            {/* Saved Businesses */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-700">
                  Saved Businesses
                </div>
                <button
                  onClick={() => setShowSavedSuppliersModal(true)}
                  className="text-xs font-semibold text-gray-700 hover:text-[#181818]"
                >
                  View all
                </button>
              </div>
              {savedSuppliers.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {savedSuppliers.map((s) => (
                    <li key={s.id} className="py-2 flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={getFullImageUrl(s.profile_image_url)}
                          alt={
                            s.company_name || `${s.first_name} ${s.last_name}`
                          }
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-[#181818] truncate"
                          title={
                            s.company_name || `${s.first_name} ${s.last_name}`
                          }
                        >
                          {s.company_name || `${s.first_name} ${s.last_name}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {s.company_description || ""}
                        </div>
                      </div>
                      <Link
                        href={`/seller/${s.id}`}
                        className="text-xs font-semibold text-[#181818] hover:underline"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">
                  No saved businesses.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Global Search */}
        <section className="px-6 md:px-12 mt-10">
          <div className="w-full">
            <form
              onSubmit={onSearchSubmit}
              className="relative flex bg-white rounded-full shadow-lg overflow-hidden border border-gray-200"
            >
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F4D300]">
                <FiSearch size={20} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search products"
                className="flex-1 pl-12 pr-4 py-3 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-base font-medium border-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#F4D300] text-[#181818] font-semibold text-base hover:bg-yellow-400 transition"
              >
                Search
              </button>
            </form>
            {open && (suggestions.length > 0 || searchLoading) && (
              <div className="relative z-20 mt-2 w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <ul className="max-h-80 overflow-auto">
                  {searchLoading && (
                    <li className="px-4 py-3 text-sm text-gray-500">
                      Searching…
                    </li>
                  )}
                  {!searchLoading &&
                    suggestions.map((s) => (
                      <li key={s.id} className="hover:bg-gray-50">
                        <a
                          href={`/product/${s.id}`}
                          className="flex items-center gap-3 px-4 py-3"
                          onClick={() => setOpen(false)}
                        >
                          <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                            <img
                              src={s.image_url || "/images/default-product.jpg"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {s.name}
                            </div>
                            {s.price !== null && s.price !== undefined && (
                              <div className="text-xs text-gray-500">
                                ₹{s.price}
                              </div>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                </ul>
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (query) params.set("q", query);
                      router.push(`/products-list?${params.toString()}`);
                    }}
                    className="w-full text-center px-4 py-3 text-sm font-medium text-[#181818] hover:bg-gray-50"
                  >
                    View all results
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Featured Categories - compact cards, no redundant CTA */}
        <section className="px-6 md:px-12 mt-10">
          <h3 className="text-lg font-semibold text-[#181818] mb-4">
            Featured Categories
          </h3>
          <CategoriesSection compact categories={mappedCategories} />
        </section>

        {/* Suggested Businesses removed as requested */}

        {/* Browse Products */}
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
      {/* Saved Products Modal */}
      {showSavedProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-[#181818]">
                All Saved Products
              </h3>
              <button
                onClick={() => setShowSavedProductsModal(false)}
                className="text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {savedProductsAll && savedProductsAll.length === 0 ? (
                <div className="text-sm text-gray-500">No saved products.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {savedProductsAll?.map((p: Product) => (
                    <li key={p.id} className="py-3 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={getFullImageUrl(p.image_url)}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-[#181818] truncate"
                          title={p.name}
                        >
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ₹{p.price?.toLocaleString?.() || p.price}
                        </div>
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        className="text-xs font-semibold text-[#181818] hover:underline"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Businesses Modal */}
      {showSavedSuppliersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-[#181818]">
                All Saved Businesses
              </h3>
              <button
                onClick={() => setShowSavedSuppliersModal(false)}
                className="text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {savedSuppliersAll && savedSuppliersAll.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No saved businesses.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {savedSuppliersAll?.map((s: SavedSupplier) => (
                    <li key={s.id} className="py-3 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={getFullImageUrl(s.profile_image_url)}
                          alt={
                            s.company_name || `${s.first_name} ${s.last_name}`
                          }
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium text-[#181818] truncate"
                          title={
                            s.company_name || `${s.first_name} ${s.last_name}`
                          }
                        >
                          {s.company_name || `${s.first_name} ${s.last_name}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {s.company_description || ""}
                        </div>
                      </div>
                      <Link
                        href={`/seller/${s.id}`}
                        className="text-xs font-semibold text-[#181818] hover:underline"
                      >
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
