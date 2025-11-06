"use client";
// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useCallback } from "react";
import { api, apiMultipart } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  selectClass,
  textInputClass,
  fileInputClass,
} from "@/components/forms/fieldClasses";
import { useAuthStore } from "@/store/auth";
import Image from "next/image";

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

export default function HoReCaFormPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string | FileList | boolean>>(
    {}
  );
  const [suppliers, setSuppliers] = useState<
    Array<{
      id: string;
      first_name: string;
      last_name: string;
      email?: string;
      company_name?: string;
      total_products: number;
    }>
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    email?: string;
    phone_number?: string;
  }>({});
  const [selectedSupplier, setSelectedSupplier] = useState<{
    supplier: {
      id: string;
      first_name: string;
      last_name: string;
      company_name?: string;
      total_products: number;
    };
    details: any;
  } | null>(null);

  // Fetch user profile for pre-filling
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (user?.id) {
          try {
            const profileRes = await api.get("/auth/me");
            const profile = profileRes.data.data;
            if (profile) {
              setUserProfile({
                email: profile.email || user.email,
                phone_number: profile.phone_number,
              });
            } else {
              setUserProfile({
                email: user.email,
              });
            }
          } catch {
            setUserProfile({
              email: user.email,
            });
          }
        } else {
          setUserProfile({
            email: user?.email,
          });
        }
      } catch {
        setUserProfile({
          email: user?.email,
        });
      }
    };
    fetchUserProfile();
  }, [user]);

  // Pre-fill form with user data
  useEffect(() => {
    if (userProfile.email || userProfile.phone_number) {
      setForm((prev) => ({
        ...prev,
        email: userProfile.email || prev.email,
        phone: userProfile.phone_number || prev.phone,
      }));
    }
  }, [userProfile]);

  // Fetch suppliers with filters
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit: 20,
        formType: "HORECA", // Only show suppliers who submitted HORECA form
      };
      const response = await api.get("/products/suppliers", { params });
      const items = (response.data.data || []) as Array<{
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        company_name?: string;
        total_products: number;
      }>;
      setSuppliers(items);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoadingSuppliers(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const submit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("form_type", "HORECA");
      fd.append(
        "contact_name",
        String(form.establishment_name || form.name || "")
      );
      fd.append("contact_email", String(form.email || ""));
      fd.append("contact_phone", String(form.phone || ""));
      Object.entries(form).forEach(([k, v]) => {
        if (k === "agreed") return; // Skip internal flags
        if (v instanceof FileList)
          Array.from(v).forEach((f) => fd.append(k, f));
        else if (v !== undefined && v !== null && typeof v !== "boolean")
          fd.append(k, String(v));
        else if (typeof v === "boolean") fd.append(k, v.toString());
      });
      await apiMultipart.post("/forms/submit", fd);
      setSubmitted(true);
      setShowForm(false);
      fetchSuppliers();
    } finally {
      setLoading(false);
    }
  };

  function SupplierCard({
    supplier,
    router,
    onOpen,
  }: {
    supplier: {
      id: string;
      first_name: string;
      last_name: string;
      email?: string;
      company_name?: string;
      total_products: number;
    };
    router: { push: (path: string) => void };
    onOpen?: (s: any, d: any) => void;
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
      let alive = true;
      (async () => {
        try {
          const res = await api.get(`/suppliers/${supplier.id}`);
          if (!alive) return;
          setDetails(res.data?.data || null);
        } catch {
          // ignore
        }
      })();
      return () => {
        alive = false;
      };
    }, [supplier.id]);

    const name =
      supplier.company_name || `${supplier.first_name} ${supplier.last_name}`;

    return (
      <div
        className="group cursor-pointer bg-white rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full"
        onClick={() => onOpen && onOpen(supplier, details)}
      >
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
        <div className="p-4 flex flex-col gap-3 h-[160px]">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-base font-semibold text-[#181818] group-hover:text-yellow-600 transition-colors">
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
            <div className="text-right">
              <div className="text-sm text-gray-700 font-medium">
                {supplier.total_products} product
                {supplier.total_products !== 1 ? "s" : ""}
              </div>
              {details?.website && (
                <a
                  href={details.website}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Visit website
                </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            {details?.email && (
              <div className="truncate">
                <span className="text-gray-500">Email: </span>
                {details.email}
              </div>
            )}
            {details?.phone_number && (
              <div className="truncate sm:text-right">
                <span className="text-gray-500">Phone: </span>
                {details.phone_number}
              </div>
            )}
          </div>
          {details?.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {details.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-sm text-gray-500">Browse</h2>
            <h1 className="text-4xl font-extrabold text-[#181818]">HoReCa</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-semibold text-[#111827] underline underline-offset-4"
          >
            {showForm ? "View Listings" : "Submit Form"}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-8 mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Establishment Details
            </h3>
            {submitted ? (
              <div className="text-green-700">
                Thanks! We received your submission.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Establishment Name">
                    <input
                      className={textInputClass}
                      onChange={(e) =>
                        setForm({ ...form, establishment_name: e.target.value })
                      }
                      placeholder="Restaurant/Cafe/Hotel"
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
                    <select
                      className={selectClass}
                      value={(form.country as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, country: e.target.value })
                      }
                    >
                      <option value="">Select Country</option>
                      <option>India</option>
                      <option>United States</option>
                      <option>United Arab Emirates</option>
                      <option>United Kingdom</option>
                      <option>Singapore</option>
                    </select>
                  </Field>
                  <Field label="Category">
                    <select
                      className={selectClass}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    >
                      <option value="">Select</option>
                      <option>Hotel</option>
                      <option>Restaurant</option>
                      <option>Café</option>
                      <option>Catering</option>
                    </select>
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
                  <Field label="Menu">
                    <input
                      type="file"
                      multiple
                      className={fileInputClass}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          menu_files: e.target.files || (undefined as any),
                        })
                      }
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
                          photos: e.target.files || (undefined as any),
                        })
                      }
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={textInputClass}
                      value={(form.email as string) || ""}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@example.com"
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
          <>
            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loadingSuppliers ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-white rounded-2xl border border-yellow-100 animate-pulse"
                  />
                ))
              ) : suppliers.length === 0 ? (
                <div className="col-span-full mt-16 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h2 className="text-xl font-semibold text-[#181818]">
                    No suppliers found
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    No suppliers have submitted HORECA forms yet.
                  </p>
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    router={router}
                    onOpen={(s, d) =>
                      setSelectedSupplier({ supplier: s, details: d })
                    }
                  />
                ))
              )}
            </div>
            {suppliers.length > 0 && (
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
            {/* Modal */}
            {selectedSupplier && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setSelectedSupplier(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    <img
                      src="/images/default-product.jpg"
                      alt="cover"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-[#181818]">
                        {selectedSupplier.supplier.company_name ||
                          `${selectedSupplier.supplier.first_name} ${selectedSupplier.supplier.last_name}`}
                      </h3>
                      <button
                        className="text-sm text-gray-600"
                        onClick={() => setSelectedSupplier(null)}
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                      {selectedSupplier.details?.city && (
                        <div>City: {selectedSupplier.details.city}</div>
                      )}
                      {selectedSupplier.details?.state && (
                        <div>State: {selectedSupplier.details.state}</div>
                      )}
                      {selectedSupplier.details?.country && (
                        <div>Country: {selectedSupplier.details.country}</div>
                      )}
                      {selectedSupplier.details?.email && (
                        <div className="truncate">
                          Email: {selectedSupplier.details.email}
                        </div>
                      )}
                      {selectedSupplier.details?.phone_number && (
                        <div className="truncate">
                          Phone: {selectedSupplier.details.phone_number}
                        </div>
                      )}
                    </div>
                    {selectedSupplier.details?.description && (
                      <p className="mt-3 text-sm text-gray-600">
                        {selectedSupplier.details.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
