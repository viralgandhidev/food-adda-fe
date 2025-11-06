"use client";
// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import { api, apiMultipart } from "@/lib/api";
import {
  textInputClass,
  selectClass,
  fileInputClass,
  textAreaClass,
} from "@/components/forms/fieldClasses";
import { useAuthStore } from "@/store/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as Slider from "@radix-ui/react-slider";

type FormValue = string | FileList | boolean | undefined;
type FormData = Record<string, FormValue>;

type Supplier = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  company_name?: string;
  total_products: number;
};

type CategoryNode = {
  id: string;
  name: string;
  product_count?: number;
  children?: CategoryNode[];
  parent_id?: string | null;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-[12px] text-[#111827]">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function CountrySelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const countries = [
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "GB", name: "United Kingdom" },
    { code: "SG", name: "Singapore" },
  ];
  return (
    <select
      className={selectClass}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select Country</option>
      {countries.map((c) => (
        <option key={c.code} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function SupplierCard({
  supplier,
  router,
}: {
  supplier: Supplier;
  router: { push: (path: string) => void };
}) {
  const [details, setDetails] = useState<{
    email?: string;
    phone_number?: string;
    website?: string;
    city?: string;
    state?: string;
    country?: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get(`/suppliers/${supplier.id}`);
        if (!isMounted) return;
        setDetails(res.data?.data || null);
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [supplier.id]);

  const name =
    supplier.company_name || `${supplier.first_name} ${supplier.last_name}`;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden h-full"
      onClick={() => router.push(`/seller/${supplier.id}`)}
    >
      {/* Cover */}
      <div className="relative h-24 w-full bg-gray-100">
        <img
          src="/images/default-product.jpg"
          alt={name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute right-2 bottom-2 text-[11px] font-medium bg-white/90 text-gray-900 px-2 py-0.5 rounded-full border border-gray-200">
          {supplier.total_products} product
          {supplier.total_products !== 1 ? "s" : ""}
        </span>
      </div>
      {/* Content with fixed height */}
      <div className="p-4 flex flex-col gap-3 h-[160px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {details?.city && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                  {details.city}
                </span>
              )}
              {details?.state && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                  {details.state}
                </span>
              )}
              {details?.country && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                  {details.country}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {details?.website && (
              <a
                href={details.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Website
              </a>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 grow">
          {details?.description || "No description provided."}
        </p>
        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {details?.email && (
            <div className="truncate text-gray-700">
              <span className="text-gray-500">Email: </span>
              {details.email}
            </div>
          )}
          {details?.phone_number && (
            <div className="truncate text-gray-700 sm:text-right">
              <span className="text-gray-500">Phone: </span>
              {details.phone_number}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function B2BFormPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [categoriesFlat, setCategoriesFlat] = useState<CategoryNode[]>([]);
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [allKeywords, setAllKeywords] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [isVeg, setIsVeg] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  // Always attempt to pre-fill email and phone on mount
  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/auth/me");
        const profile = res.data?.data;
        setForm((prev) => ({
          ...prev,
          email: profile?.email || prev.email || user?.email || "",
          phone: profile?.phone_number || prev.phone,
        }));
      } catch {
        if (user?.email) {
          setForm((prev) => ({ ...prev, email: prev.email || user.email }));
        }
      }
    };
    run();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/tree");
        setCategoryTree(res.data.data || []);
        const flatten = (nodes: CategoryNode[]): CategoryNode[] => {
          const result: CategoryNode[] = [];
          nodes.forEach((node) => {
            result.push(node);
            if (node.children) {
              result.push(...flatten(node.children));
            }
          });
          return result;
        };
        setCategoriesFlat(flatten(res.data.data || []));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch keywords
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const res = await api.get("/keywords/all");
        setAllKeywords(res.data.data || []);
      } catch (err) {
        console.error("Error fetching keywords:", err);
      }
    };
    fetchKeywords();
  }, []);

  // Fetch suppliers with filters
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit: 20,
        formType: "B2B", // Only show suppliers who submitted B2B form
      };
      if (mainCategory) params.mainCategoryId = mainCategory;
      if (subCategory) params.subCategoryId = subCategory;
      if (selectedKeywordIds.length)
        params.keywordIds = selectedKeywordIds.join(",");
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
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
      setLoadingSuppliers(false);
    }
  }, [
    page,
    mainCategory,
    subCategory,
    selectedKeywordIds,
    minPrice,
    maxPrice,
    isVeg,
  ]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const submit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("form_type", "B2B");
      fd.append("contact_name", String((form as any).name || ""));
      fd.append("contact_email", String(form.email || ""));
      fd.append("contact_phone", String(form.phone || ""));
      Object.entries(form).forEach(([k, v]) => {
        if (v instanceof FileList) {
          Array.from(v).forEach((file) => fd.append(k, file));
        } else if (typeof v === "string" && v) {
          fd.append(k, v);
        } else if (typeof v === "boolean") {
          fd.append(k, v.toString());
        }
      });
      await apiMultipart.post("/forms/submit", fd);
      setSubmitted(true);
      setShowForm(false);
      fetchSuppliers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-sm text-gray-500">Browse</h2>
            <h1 className="text-4xl font-extrabold text-[#181818]">B2B</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-semibold text-[#111827] underline underline-offset-4"
          >
            {showForm ? "View Listings" : "Submit Form"}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Details
            </h3>
            {submitted ? (
              <div className="text-green-700">
                Thanks! We received your submission.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Name">
                    <input
                      className={textInputClass}
                      value={(form.name as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Your name"
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      placeholder="City"
                    />
                  </Field>
                  <Field label="State">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value })
                      }
                      placeholder="State"
                    />
                  </Field>
                  <Field label="Country">
                    <CountrySelect
                      value={form.country as string}
                      onChange={(v) => setForm({ ...form, country: v })}
                    />
                  </Field>
                  <Field label="URL (Website)">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, website: e.target.value })
                      }
                      placeholder="https://"
                    />
                  </Field>
                  <Field label="Google Location">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      placeholder="Link"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={textInputClass}
                      value={(form.email as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@company.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={textInputClass}
                      value={(form.phone as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="+1 555 000 0000"
                    />
                  </Field>
                  <Field label="WhatsApp No.">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, whatsapp: e.target.value })
                      }
                      placeholder="WhatsApp"
                    />
                  </Field>
                  <Field label="GST No.">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, gst: e.target.value })
                      }
                      placeholder="GSTIN"
                    />
                  </Field>
                  <Field label="FSSAI No.">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, fssai: e.target.value })
                      }
                      placeholder="FSSAI"
                    />
                  </Field>
                  <Field label="Product Description">
                    <textarea
                      className={textAreaClass}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Describe your products"
                    />
                  </Field>
                  <Field label="Contact Person">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, contact_person: e.target.value })
                      }
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Designation">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, designation: e.target.value })
                      }
                      placeholder="Title"
                    />
                  </Field>
                  <Field label="Upload Photos">
                    <input
                      type="file"
                      multiple
                      className={fileInputClass}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          photos: e.target.files || undefined,
                        })
                      }
                    />
                  </Field>
                  <Field label="MOQ Required">
                    <input
                      type="number"
                      min={0}
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, moq: e.target.value })
                      }
                      placeholder="Minimum order quantity"
                    />
                  </Field>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setForm({ ...form, agreed: e.target.checked })
                      }
                    />
                    <span>I read & agreed to the terms and conditions</span>
                  </label>
                  <button
                    disabled={loading || !form.agreed}
                    onClick={submit}
                    className="bg-[#F4D300] text-[#181818] font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-400"
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Categories
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={mainCategory}
                      onChange={(e) => {
                        setMainCategory(e.target.value);
                        setSubCategory("");
                        setPage(1);
                      }}
                      className="px-3 py-2 pr-8 rounded-lg border font-semibold text-sm shadow-sm bg-gray-50 w-full focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition text-gray-700 border-gray-200 appearance-none"
                    >
                      <option value="">Select Main Category</option>
                      {categoriesFlat
                        .filter((n) => !n.parent_id)
                        .map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                    </select>
                    <select
                      value={subCategory}
                      onChange={(e) => {
                        setSubCategory(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 pr-8 rounded-lg border font-semibold text-sm shadow-sm bg-gray-50 w-full focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300] transition text-gray-700 border-gray-200 appearance-none"
                      disabled={!mainCategory}
                    >
                      <option value="">Select Sub Category</option>
                      {categoriesFlat
                        .filter((n) => n.parent_id === mainCategory)
                        .map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.name}
                          </option>
                        ))}
                    </select>
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
                                : selectedKeywordIds.filter(
                                    (id) => id !== k.id
                                  );
                              setSelectedKeywordIds(next);
                              setPage(1);
                            }}
                            className="h-4 w-4 accent-yellow-400"
                          />
                          <span className="text-sm text-gray-800">
                            {k.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Price
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 rounded-lg border text-sm w-full bg-gray-50 text-gray-700 border-gray-200 focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300]"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setPage(1);
                      }}
                      className="px-3 py-2 rounded-lg border text-sm w-full bg-gray-50 text-gray-700 border-gray-200 focus:ring-2 focus:ring-[#F4D300] focus:border-[#F4D300]"
                    />
                  </div>
                </div>

                {/* Diet */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Diet
                  </h4>
                  <div className="flex flex-col gap-2">
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm border ${
                        isVeg === ""
                          ? "bg-gray-100 text-gray-700 border-gray-200"
                          : "bg-white text-gray-700 border-gray-200"
                      }`}
                      onClick={() => {
                        setIsVeg("");
                        setPage(1);
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm border ${
                        isVeg === "veg"
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-white text-green-700 border-gray-200"
                      }`}
                      onClick={() => {
                        setIsVeg("veg");
                        setPage(1);
                      }}
                    >
                      Veg
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm border ${
                        isVeg === "nonveg"
                          ? "bg-red-500 text-white border-red-600"
                          : "bg-white text-red-700 border-gray-200"
                      }`}
                      onClick={() => {
                        setIsVeg("nonveg");
                        setPage(1);
                      }}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Suppliers Grid */}
            <div className="lg:col-span-3">
              {loadingSuppliers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-white rounded-lg border animate-pulse"
                    />
                  ))}
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No suppliers found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suppliers.map((supplier) => (
                      <SupplierCard
                        key={supplier.id}
                        supplier={supplier}
                        router={router}
                      />
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm text-[#111827] shadow-sm hover:bg-gray-50 disabled:opacity-60"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span className="text-sm font-medium text-[#111827]">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm text-[#111827] shadow-sm hover:bg-gray-50 disabled:opacity-60"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
