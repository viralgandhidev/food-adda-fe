"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/home/ProductCard";
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

interface Supplier {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  company_name?: string;
  total_products: number;
}

interface CategoryNode {
  id: string;
  name: string;
  product_count: number;
  children?: CategoryNode[];
  parent_id?: string | null;
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [categoriesFlat, setCategoriesFlat] = useState<CategoryNode[]>([]);
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [allKeywords, setAllKeywords] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab =
    (searchParams.get("tab") as "products" | "suppliers") || "products";
  const [activeTab, setActiveTab] = useState<"products" | "suppliers">(
    initialTab
  );

  // Filter state
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; name: string; image_url?: string }>
  >([]);
  const [kwSuggestions, setKwSuggestions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  // const [category, setCategory] = useState("");
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

  // Preserve current tab and existing filters while updating URL
  const pushWithParams = (params: {
    page?: number;
    tab?: "products" | "suppliers";
    mainCategoryId?: string;
    subCategoryId?: string;
    keywordIds?: string;
  }) => {
    const usp = new URLSearchParams();
    usp.set("page", String(params.page ?? 1));
    const tabVal = params.tab ?? activeTab;
    if (tabVal) usp.set("tab", tabVal);
    const mainVal = params.mainCategoryId ?? mainCategory;
    if (mainVal) usp.set("mainCategoryId", mainVal);
    const subVal = params.subCategoryId ?? subCategory;
    if (subVal) usp.set("subCategoryId", subVal);
    const kwVal =
      params.keywordIds ??
      (selectedKeywordIds.length ? selectedKeywordIds.join(",") : undefined);
    if (kwVal) usp.set("keywordIds", kwVal);
    router.push(`/products-list?${usp.toString()}`);
  };

  // Fetch categories tree for filter and all keywords
  useEffect(() => {
    api.get("/categories/tree").then((res) => {
      setCategoryTree(res.data.data || []);
    });
    api.get("/categories").then((res) => {
      setCategoriesFlat(res.data.data || []);
    });
    api.get("/keywords/all").then((res) => {
      const items = (res.data?.data || []) as { id: string; name: string }[];
      setAllKeywords(items);
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

  // Suggestions fetch
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!search) {
      setSuggestions([]);
      setKwSuggestions([]);
      setOpenSuggest(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [res, kw] = await Promise.all([
          api.get("/products", { params: { q: search, limit: 5 } }),
          api.get("/keywords/search", { params: { q: search, limit: 5 } }),
        ]);
        const items = (res.data?.data || []) as Array<{
          id: string;
          name: string;
          image_url?: string;
        }>;
        setSuggestions(items.slice(0, 5));
        setKwSuggestions(
          (kw.data?.data || []) as Array<{ id: string; name: string }>
        );
        setOpenSuggest(true);
      } catch {
        setSuggestions([]);
        setKwSuggestions([]);
        setOpenSuggest(false);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
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

  // No longer restrict keywords by category; we load all once above

  // Fetch products on filter/search/page change (use debouncedSearch and debouncedMinPrice/MaxPrice)
  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    } else {
      fetchSuppliers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    mainCategory,
    subCategory,
    selectedKeywordIds,
    debouncedMinPrice,
    debouncedMaxPrice,
    isVeg,
    sort,
    page,
    activeTab,
  ]);

  // Sync category state with URL (back-compat: categoryId)
  useEffect(() => {
    const urlCategoryId = searchParams.get("categoryId") || "";
    const urlMain = searchParams.get("mainCategoryId") || "";
    const urlSub = searchParams.get("subCategoryId") || "";
    const urlKw = searchParams.get("keywordId") || ""; // back-compat
    const urlKws = searchParams.get("keywordIds") || "";
    if (urlMain !== mainCategory) setMainCategory(urlMain);
    if (urlSub !== subCategory) setSubCategory(urlSub || urlCategoryId);
    const parsed = urlKws
      ? urlKws.split(",").filter(Boolean)
      : urlKw
      ? [urlKw]
      : [];
    // Only set if different to avoid loops
    if (
      parsed.length !== selectedKeywordIds.length ||
      parsed.some((id, i) => id !== selectedKeywordIds[i])
    ) {
      setSelectedKeywordIds(parsed);
    }
  }, [searchParams]);

  // Keep tab in sync with URL
  useEffect(() => {
    const urlTab =
      (searchParams.get("tab") as "products" | "suppliers") || "products";
    if (urlTab !== activeTab) setActiveTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Build params for /products API
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (mainCategory) params.mainCategoryId = mainCategory;
      if (subCategory) params.subCategoryId = subCategory;
      if (selectedKeywordIds.length)
        params.keywordIds = selectedKeywordIds.join(",");
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

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (mainCategory) params.mainCategoryId = mainCategory;
      if (subCategory) params.subCategoryId = subCategory;
      if (selectedKeywordIds.length)
        params.keywordIds = selectedKeywordIds.join(",");
      if (debouncedMinPrice) params.minPrice = debouncedMinPrice;
      if (debouncedMaxPrice) params.maxPrice = debouncedMaxPrice;
      if (isVeg)
        params.isVeg =
          isVeg === "veg" ? true : isVeg === "nonveg" ? false : undefined;
      const response = await api.get("/products/suppliers", { params });
      const items = (response.data.data || []) as Supplier[];
      setSuppliers(items);
      setTotal(response.data.meta?.total || 0);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for filter changes
  // const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setCategory(e.target.value);
  //   if (e.target.value) {
  //     router.push(`/products-list?page=1&categoryId=${e.target.value}`);
  //   } else {
  //     router.push(`/products-list?page=1`);
  //   }
  // };
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
    pushWithParams({ page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    pushWithParams({ page: newPage });
  };

  // For price slider, update min/max price
  // No longer needed with Radix Slider

  return (
    <MainLayout>
      <section className="p-16 mb-12">
        <div className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <h1 className="text-3xl font-bold text-[#181818]">Browse</h1>
          <Link
            href="/dashboard"
            className="bg-[#F4D300] text-[#181818] font-semibold px-7 py-2 rounded-full shadow hover:bg-yellow-400 transition text-lg w-fit"
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
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition shadow-sm ${
                        !mainCategory && !subCategory
                          ? "bg-[#F4D300] text-[#181818] border-yellow-300"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-yellow-50"
                      }`}
                      onClick={() => {
                        setMainCategory("");
                        setSubCategory("");
                        pushWithParams({ page: 1 });
                      }}
                    >
                      All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <select
                      value={mainCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMainCategory(val);
                        setSubCategory("");
                        pushWithParams({
                          page: 1,
                          mainCategoryId: val || undefined,
                          subCategoryId: undefined,
                        });
                      }}
                      className="px-3 py-2 pr-8 rounded-lg border font-semibold text-sm shadow-sm bg-gray-50 w-full focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition text-gray-700 border-gray-200 appearance-none"
                    >
                      <option value="">Select Main Category</option>
                      {(categoriesFlat.length
                        ? categoriesFlat.filter((n) => !n.parent_id)
                        : categoryTree
                      ).map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={subCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubCategory(val);
                        pushWithParams({
                          page: 1,
                          subCategoryId: val || undefined,
                        });
                      }}
                      className="px-3 py-2 pr-8 rounded-lg border font-semibold text-sm shadow-sm bg-gray-50 w-full focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition text-gray-700 border-gray-200 appearance-none"
                      disabled={!mainCategory}
                    >
                      <option value="">Select Sub Category</option>
                      {(categoriesFlat.length
                        ? categoriesFlat.filter(
                            (n) => n.parent_id === mainCategory
                          )
                        : categoryTree.find((n) => n.id === mainCategory)
                            ?.children || []
                      ).map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Keywords
                </h4>
                <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 p-2 bg-gray-50">
                  {allKeywords.map((k) => {
                    const checked = selectedKeywordIds.includes(k.id);
                    return (
                      <label
                        key={k.id}
                        className="flex items-center gap-2 py-1 px-2 hover:bg-white rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedKeywordIds, k.id]
                              : selectedKeywordIds.filter((id) => id !== k.id);
                            setSelectedKeywordIds(next);
                            pushWithParams({
                              page: 1,
                              keywordIds: next.length
                                ? next.join(",")
                                : undefined,
                            });
                          }}
                          className="h-4 w-4 accent-yellow-400"
                        />
                        <span className="text-sm text-gray-800">{k.name}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedKeywordIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedKeywordIds.map((id) => {
                      const kw = allKeywords.find((k) => k.id === id);
                      if (!kw) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            const next = selectedKeywordIds.filter(
                              (kid) => kid !== id
                            );
                            setSelectedKeywordIds(next);
                            pushWithParams({
                              page: 1,
                              keywordIds: next.length
                                ? next.join(",")
                                : undefined,
                            });
                          }}
                          className="px-2 py-1 rounded-full border border-yellow-300 bg-yellow-100 text-yellow-800 text-xs"
                        >
                          {kw.name} ×
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setSelectedKeywordIds([]);
                        pushWithParams({ page: 1, keywordIds: undefined });
                      }}
                      className="px-2 py-1 rounded-full border border-gray-300 bg-gray-100 text-gray-700 text-xs"
                    >
                      Clear keywords
                    </button>
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
                      pushWithParams({ page: 1 });
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
                      pushWithParams({ page: 1 });
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
                      pushWithParams({ page: 1 });
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
                    className="w-24 h-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition"
                  />
                  <Input
                    type="number"
                    min={priceRange[0]}
                    max={10000}
                    placeholder="Max"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="w-24 h-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Right content: search, sort, products */}
          <div className="md:col-span-9">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-2xl p-2 mb-4 border border-gray-100 inline-flex">
              <button
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === "products"
                    ? "bg-[#F4D300] text-[#181818]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setActiveTab("products");
                  pushWithParams({ page: 1, tab: "products" });
                }}
              >
                Products
              </button>
              <button
                className={`ml-2 px-6 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === "suppliers"
                    ? "bg-[#F4D300] text-[#181818]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => {
                  setActiveTab("suppliers");
                  pushWithParams({ page: 1, tab: "suppliers" });
                }}
              >
                Suppliers
              </button>
            </div>
            {/* Search bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 border border-gray-100">
              <div className="relative w-full">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F4D300] z-10">
                  <FiSearch size={24} className="font-bold" />
                </span>
                <Input
                  placeholder={
                    activeTab === "products"
                      ? "Search for products, brands, categories..."
                      : "Search suppliers by products, categories, keywords..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 text-lg bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition placeholder:text-gray-400 text-gray-900 font-medium shadow-lg pl-14 pr-14"
                />
                {openSuggest &&
                  (suggestions.length > 0 ||
                    kwSuggestions.length > 0 ||
                    searchLoading) && (
                    <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                      {searchLoading && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          Searching…
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        <div className="border-b md:border-b-0 md:border-r border-gray-100">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Products
                          </div>
                          <ul className="max-h-72 overflow-auto">
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
                                    onClick={() => setOpenSuggest(false)}
                                  >
                                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                                      <img
                                        src={
                                          s.image_url ||
                                          "/images/default-product.jpg"
                                        }
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 text-sm font-medium text-gray-900">
                                      {s.name}
                                    </div>
                                  </a>
                                </li>
                              ))}
                            {!searchLoading && suggestions.length === 0 && (
                              <li className="px-4 py-3 text-sm text-gray-500">
                                No products
                              </li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Keywords
                          </div>
                          <ul className="max-h-72 overflow-auto">
                            {kwSuggestions.map((k) => (
                              <li key={k.id} className="hover:bg-gray-50">
                                <button
                                  className="w-full text-left flex items-center gap-3 px-4 py-3"
                                  onClick={() => {
                                    const next = Array.from(
                                      new Set([...selectedKeywordIds, k.id])
                                    );
                                    setSelectedKeywordIds(next);
                                    setOpenSuggest(false);
                                    pushWithParams({
                                      page: 1,
                                      keywordIds: next.join(","),
                                    });
                                  }}
                                >
                                  <div className="w-10 h-10 rounded bg-yellow-100 text-yellow-800 flex items-center justify-center text-sm font-semibold">
                                    #
                                  </div>
                                  <div className="flex-1 text-sm font-medium text-gray-900">
                                    {k.name}
                                  </div>
                                </button>
                              </li>
                            ))}
                            {!searchLoading && kwSuggestions.length === 0 && (
                              <li className="px-4 py-3 text-sm text-gray-500">
                                No keywords
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
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
                {activeTab === "products"
                  ? `Showing ${products.length} of ${total} products`
                  : `Showing ${suppliers.length} of ${total} suppliers`}
              </div>
              {activeTab === "products" && (
                <div>
                  <select
                    value={sort}
                    onChange={handleSortChange}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-base bg-gray-50 min-w-[160px] focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition font-semibold text-gray-800"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4D300]"></div>
              </div>
            ) : (
              <>
                {activeTab === "products" ? (
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {suppliers.map((s) => {
                      const displayName =
                        s.company_name && s.company_name.trim().length > 0
                          ? s.company_name
                          : `${s.first_name || ""} ${s.last_name || ""}`.trim();
                      return (
                        <a
                          key={s.id}
                          href={`/seller/${s.id}`}
                          className="bg-white border border-gray-200 rounded-2xl p-5 shadow hover:shadow-lg transition block"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold">
                              {displayName.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {displayName || "Supplier"}
                              </div>
                              {s.email && (
                                <div className="text-sm text-gray-600">
                                  {s.email}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-gray-700">
                            Products matching filters:{" "}
                            <span className="font-semibold">
                              {s.total_products}
                            </span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}

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
                          if (i > 0 && p - arr[i - 1] > 1) acc.push("ellipsis");
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
                                  ? "bg-[#F4D300] text-[#181818] border-yellow-300 shadow"
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
  );
}

export default function ProductsList() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ProductsListContent />
    </Suspense>
  );
}
