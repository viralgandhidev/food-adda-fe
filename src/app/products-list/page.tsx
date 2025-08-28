"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { api } from "@/lib/api";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { FiSearch } from "react-icons/fi";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  images?: {
    id: string;
    image_url: string;
    order: number;
  }[];
  is_veg: boolean;
  brand?: string;
  category_name?: string;
}

interface Category {
  id: string;
  name: string;
  product_count: number;
}

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A-Z" },
  { value: "name_desc", label: "Name: Z-A" },
];

function ProductsListContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [isVeg, setIsVeg] = useState("");
  const [sort, setSort] = useState("relevance");
  // Removed activeThumb management as Radix Slider handles interaction

  // Add debounce for price changes
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);
  const priceTimeout = useRef<NodeJS.Timeout | null>(null);

  const page = Number(searchParams.get("page")) || 1;
  const limit = 20;

  // Fetch categories for filter
  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(res.data.data || []);
    });
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  // Debounce min/max price changes
  useEffect(() => {
    if (priceTimeout.current) clearTimeout(priceTimeout.current);
    priceTimeout.current = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 300);
    return () => {
      if (priceTimeout.current) clearTimeout(priceTimeout.current);
    };
  }, [minPrice, maxPrice]);

  // Fetch products on filter/search/page change (use debouncedSearch and debouncedMinPrice/MaxPrice)
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    category,
    debouncedMinPrice,
    debouncedMaxPrice,
    isVeg,
    sort,
    page,
  ]);

  // Sync category state with categoryId from URL
  useEffect(() => {
    const urlCategoryId = searchParams.get("categoryId") || "";
    if (urlCategoryId !== category) {
      setCategory(urlCategoryId);
    }
  }, [searchParams, category]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Build params for /products API
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (category) params.categoryId = category;
      if (debouncedMinPrice) params.minPrice = debouncedMinPrice;
      if (debouncedMaxPrice) params.maxPrice = debouncedMaxPrice;
      if (isVeg)
        params.isVeg =
          isVeg === "veg" ? true : isVeg === "nonveg" ? false : undefined;
      if (sort && sort !== "relevance") {
        if (sort.startsWith("price")) {
          params.sortBy = "price";
          params.sortOrder = sort.endsWith("asc") ? "asc" : "desc";
        } else if (sort.startsWith("name")) {
          params.sortBy = "name";
          params.sortOrder = sort.endsWith("asc") ? "asc" : "desc";
        }
      }
      const response = await api.get("/products", { params });
      setProducts(response.data.data || []);
      setTotal(response.data.meta?.total || 0);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for filter changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    if (e.target.value) {
      router.push(`/products-list?page=1&categoryId=${e.target.value}`);
    } else {
      router.push(`/products-list?page=1`);
    }
  };
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const nextMin = Math.max(0, Math.min(raw, priceRange[1]));
    setMinPrice(isNaN(nextMin) ? "" : String(nextMin));
    setPriceRange([isNaN(nextMin) ? 0 : nextMin, priceRange[1]]);
  };
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const nextMax = Math.min(10000, Math.max(raw, priceRange[0]));
    setMaxPrice(isNaN(nextMax) ? "" : String(nextMax));
    setPriceRange([priceRange[0], isNaN(nextMax) ? priceRange[1] : nextMax]);
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
    router.push(`/products-list?page=1`);
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/products-list?page=${newPage}`);
  };

  // For price slider, update min/max price
  // No longer needed with Radix Slider

  return (
    <ProtectedRoute>
      <MainLayout>
        <section className="p-16 mb-12">
          <div className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <h1 className="text-3xl font-bold text-[#181818]">All Products</h1>
            <Link
              href="/"
              className="bg-[#FFD600] text-[#181818] font-semibold px-7 py-2 rounded-full shadow hover:bg-yellow-400 transition text-lg w-fit"
            >
              Back to Home
            </Link>
          </div>

          {/* Two-column layout: filters on left, products on right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sidebar Filters */}
            <aside className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm ${
                        category === ""
                          ? "bg-[#FFD600] text-[#181818] border-yellow-300"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-yellow-50"
                      }`}
                      onClick={() => {
                        setCategory("");
                        router.push(`/products-list?page=1`);
                      }}
                    >
                      All
                    </button>
                    {categories.slice(0, 6).map((cat) => (
                      <button
                        key={cat.id}
                        className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm ${
                          category === cat.id
                            ? "bg-[#FFD600] text-[#181818] border-yellow-300"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-yellow-50"
                        }`}
                        onClick={() => {
                          setCategory(cat.id);
                          router.push(
                            `/products-list?page=1&categoryId=${cat.id}`
                          );
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {categories.length > 6 && (
                    <div className="relative mt-3">
                      <select
                        value={category}
                        onChange={handleCategoryChange}
                        className="px-3 py-2 pr-8 rounded-lg border font-semibold text-sm shadow-sm bg-gray-50 w-full focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] transition text-gray-700 border-gray-200 appearance-none"
                      >
                        <option value="">More...</option>
                        {categories.slice(6).map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M7 10l5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  )}
                </div>

                {/* Diet */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Diet
                  </h4>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm border ${
                        isVeg === ""
                          ? "bg-gray-100 text-gray-700 border-gray-200"
                          : ""
                      }`}
                      onClick={() => {
                        setIsVeg("");
                        router.push(`/products-list?page=1`);
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm border ${
                        isVeg === "veg"
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-gray-100 text-green-700 border-gray-200 hover:bg-green-50"
                      }`}
                      onClick={() => {
                        setIsVeg("veg");
                        router.push(`/products-list?page=1`);
                      }}
                    >
                      Veg
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm border ${
                        isVeg === "nonveg"
                          ? "bg-red-500 text-white border-red-600"
                          : "bg-gray-100 text-red-700 border-gray-200 hover:bg-red-50"
                      }`}
                      onClick={() => {
                        setIsVeg("nonveg");
                        router.push(`/products-list?page=1`);
                      }}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Price
                  </h4>
                  <div className="relative w-full flex items-center gap-2 mb-2">
                    <span className="text-gray-500 text-sm">
                      ₹{priceRange[0]}
                    </span>
                    <div className="w-full px-1">
                      <Slider.Root
                        className="relative flex items-center select-none touch-none h-6 w-full"
                        min={0}
                        max={10000}
                        step={1}
                        value={priceRange}
                        onValueChange={(vals: number[]) => {
                          const [minV, maxV] = vals;
                          const nextMin = Math.max(0, Math.min(minV, maxV));
                          const nextMax = Math.min(
                            10000,
                            Math.max(maxV, nextMin)
                          );
                          setPriceRange([nextMin, nextMax]);
                          setMinPrice(String(nextMin));
                          setMaxPrice(String(nextMax));
                        }}
                        aria-label="Price range"
                      >
                        <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
                          <Slider.Range className="absolute bg-yellow-400 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block w-4 h-4 bg-white border border-gray-300 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                        <Slider.Thumb className="block w-4 h-4 bg-white border border-gray-300 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                      </Slider.Root>
                    </div>
                    <span className="text-gray-500 text-sm">
                      ₹{priceRange[1]}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Input
                      type="number"
                      min={0}
                      max={priceRange[1]}
                      placeholder="Min"
                      value={minPrice}
                      onChange={handleMinPriceChange}
                      className="w-24 h-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] transition"
                    />
                    <Input
                      type="number"
                      min={priceRange[0]}
                      max={10000}
                      placeholder="Max"
                      value={maxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-24 h-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] transition"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Right content: search, sort, products */}
            <div className="md:col-span-9">
              {/* Search bar */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border border-gray-100">
                <div className="relative w-full">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#FFD600] z-10">
                    <FiSearch size={24} className="font-bold" />
                  </span>
                  <Input
                    placeholder="Search for products, brands, categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-14 text-lg bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] transition placeholder:text-gray-400 text-gray-900 font-medium shadow-lg pl-14 pr-14"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Sort + count bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-600 text-sm">
                  Showing {products.length} of {total} products
                </div>
                <div>
                  <select
                    value={sort}
                    onChange={handleSortChange}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-base bg-gray-50 min-w-[160px] focus:ring-2 focus:ring-[#FFD600] focus:border-[#FFD600] transition font-semibold text-gray-800"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products grid */}
              {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD600]"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-3 mt-10">
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        {/* Prev button */}
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Previous page"
                        >
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M15 19l-7-7 7-7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {/* Page numbers with ellipsis */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (p) =>
                              p === 1 ||
                              p === totalPages ||
                              (p >= page - 1 && p <= page + 1) ||
                              (page <= 3 && p <= 4) ||
                              (page >= totalPages - 2 && p >= totalPages - 3)
                          )
                          .reduce((acc, p, i, arr) => {
                            if (i > 0 && p - arr[i - 1] > 1)
                              acc.push("ellipsis");
                            acc.push(p);
                            return acc;
                          }, [] as (number | "ellipsis")[])
                          .map((p, i) =>
                            p === "ellipsis" ? (
                              <span
                                key={`ellipsis-${i}`}
                                className="px-2 text-gray-400"
                              >
                                ...
                              </span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => handlePageChange(p as number)}
                                className={`w-9 h-9 flex items-center justify-center rounded-full border font-semibold transition text-base ${
                                  page === p
                                    ? "bg-[#FFD600] text-[#181818] border-yellow-300 shadow"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-yellow-50"
                                }`}
                                aria-current={page === p ? "page" : undefined}
                              >
                                {p}
                              </button>
                            )
                          )}
                        {/* Next button */}
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                          className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Next page"
                        >
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M9 5l7 7-7 7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function ProductsList() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ProductsListContent />
    </Suspense>
  );
}
