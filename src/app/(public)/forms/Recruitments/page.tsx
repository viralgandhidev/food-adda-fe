"use client";
// @ts-nocheck
/* eslint-disable */
import { useEffect, useState, useCallback } from "react";
import { api, apiMultipart } from "@/lib/api";
import {
  textInputClass,
  selectClass,
  fileInputClass,
} from "@/components/forms/fieldClasses";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

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

export default function RecruitmentsFormPage() {
  type Tab = "EMPLOYER" | "EMPLOYEE";
  const [activeTab, setActiveTab] = useState<Tab>("EMPLOYER");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string | FileList | boolean>>(
    {}
  );
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingListings, setLoadingListings] = useState(true);
  const token = useAuthStore((state) => state.token);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const loginHref = `/login?next=${encodeURIComponent("/forms/Recruitments")}`;

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      return;
    }
    try {
      if (typeof window !== "undefined") {
        setIsLoggedIn(Boolean(localStorage.getItem("token")));
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, [token]);

  // Prefill email/phone
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const p = res.data?.data;
        setForm((prev) => ({
          ...prev,
          email: p?.email || (prev.email as string) || "",
          phone: p?.phone_number || (prev.phone as string),
        }));
      } catch {}
    })();
  }, [isLoggedIn]);

  const submit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      // Temporary compatibility: keep form_type as RECRUITMENT and send kind in payload
      fd.append("form_type", "RECRUITMENT");
      fd.append("recruitment_kind", activeTab);
      fd.append("contact_name", String(form.company_name || form.name || ""));
      fd.append("contact_email", String(form.email || ""));
      fd.append("contact_phone", String(form.phone || ""));
      Object.entries(form).forEach(([k, v]) => {
        if (k === "agreed") return;
        if (v instanceof FileList)
          Array.from(v).forEach((f) => fd.append(k, f));
        else if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      await apiMultipart.post("/forms/submit", fd);
      setShowForm(false);
      fetchSubmissions();
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoadingListings(true);
      if (!isLoggedIn) {
        setSubmissions([]);
        setTotalPages(1);
        setLoadingListings(false);
        return;
      }
      const pageSize = 12;
      // Fetch RECRUITMENT and filter by recruitment_kind in payload
      const res = await api.get("/forms/list", {
        params: { form_type: "RECRUITMENT", page: 1, limit: 200 },
      });
      const all: any[] = res.data?.data || [];
      const filtered = all.filter((s) => {
        const payload =
          typeof s.payload === "string" ? JSON.parse(s.payload) : s.payload;
        const kind = (payload?.recruitment_kind || "EMPLOYER").toUpperCase();
        return kind === activeTab;
      });
      const total = filtered.length;
      const totalPagesLocal = Math.max(1, Math.ceil(total / pageSize));
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      setSubmissions(filtered.slice(start, end));
      setTotalPages(totalPagesLocal);
    } finally {
      setLoadingListings(false);
    }
  }, [activeTab, page, isLoggedIn]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const EmployerFields = (
    <>
      <Field label="Company Name">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          placeholder="Company"
        />
      </Field>
      <Field label="Role Title">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, role_title: e.target.value })}
          placeholder="e.g., Store Manager"
        />
      </Field>
      <Field label="Employment Type">
        <select
          className={selectClass}
          onChange={(e) =>
            setForm({ ...form, employment_type: e.target.value })
          }
        >
          <option value="">Select Type</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
        </select>
      </Field>
      <Field label="Monthly Salary (INR)">
        <input
          type="number"
          className={textInputClass}
          onChange={(e) => setForm({ ...form, salary: e.target.value })}
          placeholder="e.g., 30000"
        />
      </Field>
      <Field label="Job Description">
        <textarea
          className={textInputClass}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the role"
        />
      </Field>
      <Field label="Website">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://"
        />
      </Field>
    </>
  );

  const EmployeeFields = (
    <>
      <Field label="Name">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your name"
        />
      </Field>
      <Field label="Profile Title">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, profile_title: e.target.value })}
          placeholder="e.g., Chef, Sales Executive"
        />
      </Field>
      <Field label="Skills">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          placeholder="Comma-separated skills"
        />
      </Field>
      <Field label="Years of experience">
        <input
          type="number"
          min={0}
          className={textInputClass}
          onChange={(e) =>
            setForm({ ...form, experience_years: e.target.value })
          }
          placeholder="Years"
        />
      </Field>
      <Field label="Expected Salary (INR)">
        <input
          type="number"
          className={textInputClass}
          onChange={(e) =>
            setForm({ ...form, expected_salary: e.target.value })
          }
          placeholder="e.g., 25000"
        />
      </Field>
      <Field label="Portfolio/LinkedIn">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
          placeholder="Link"
        />
      </Field>
      <Field label="Upload Resume (PDF)">
        <input
          type="file"
          className={fileInputClass}
          onChange={(e) => setForm({ ...form, cv: e.target.files as any })}
        />
      </Field>
    </>
  );

  const CommonFields = (
    <>
      <Field label="Address">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
        />
      </Field>
      <Field label="City">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="City"
        />
      </Field>
      <Field label="State">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
          placeholder="State"
        />
      </Field>
      <Field label="Country">
        <CountrySelect
          value={form.country as string}
          onChange={(v) => setForm({ ...form, country: v })}
        />
      </Field>
      <Field label="Email">
        <input
          className={textInputClass}
          value={(form.email as string) || ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Phone">
        <input
          className={textInputClass}
          value={(form.phone as string) || ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+1 555 000 0000"
        />
      </Field>
      <Field label="WhatsApp No.">
        <input
          className={textInputClass}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          placeholder="WhatsApp"
        />
      </Field>
    </>
  );

  const renderCard = (s: any) => {
    const payload =
      typeof s.payload === "string" ? JSON.parse(s.payload) : s.payload;
    const title =
      activeTab === "EMPLOYER"
        ? payload?.role_title ||
          payload?.company_name ||
          s.contact_name ||
          "Employer"
        : s.contact_name ||
          payload?.name ||
          payload?.profile_title ||
          "Candidate";

    const badgeText =
      activeTab === "EMPLOYER"
        ? payload?.employment_type || "-"
        : payload?.experience_years
        ? `${payload.experience_years} yrs`
        : "-";

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden h-full">
        {/* Cover */}
        <div className="relative h-24 w-full bg-gray-100">
          <img
            src="/images/default-product.jpg"
            alt="cover"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute right-2 bottom-2 text-[11px] font-medium bg-white/90 text-gray-900 px-2 py-0.5 rounded-full border border-gray-200">
            {badgeText}
          </span>
        </div>
        {/* Body */}
        <div className="p-4 flex flex-col gap-3 h-[180px]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-[#181818] truncate">
              {title}
            </h3>
            <div className="text-[11px] text-gray-500 whitespace-nowrap">
              {new Date(s.created_at).toLocaleString()}
            </div>
          </div>
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
            <div className="truncate">City: {payload?.city || "-"}</div>
            <div className="truncate text-right">
              State: {payload?.state || "-"}
            </div>
            <div className="truncate">Country: {payload?.country || "-"}</div>
            {activeTab === "EMPLOYER" ? (
              <div className="truncate text-right">
                Salary: {payload?.salary ? `₹${payload.salary}` : "-"}
              </div>
            ) : (
              <div className="truncate text-right">
                Expected:{" "}
                {payload?.expected_salary ? `₹${payload.expected_salary}` : "-"}
              </div>
            )}
          </div>
          {/* Footer with aligned contact */}
          <div className="mt-auto flex items-center justify-between text-xs text-gray-700">
            <div className="truncate">Email: {payload?.email || "-"}</div>
            <div className="truncate text-right">
              Phone: {payload?.phone || "-"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-16">
      <div className="w-full max-w-5xl">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-sm text-gray-500">Browse</h2>
            <h1 className="text-4xl font-extrabold text-[#181818]">
              Recruitments
            </h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-semibold text-[#111827] underline underline-offset-4"
          >
            {showForm ? "View Listings" : "Submit Form"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-300 mb-6">
          {(["EMPLOYER", "EMPLOYEE"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setPage(1);
              }}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === t
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "EMPLOYER" ? "Employer" : "Employee"}
            </button>
          ))}
        </div>

        {showForm ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTab === "EMPLOYER" ? EmployerFields : EmployeeFields}
              {CommonFields}
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
          </div>
        ) : !isLoggedIn ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-10 text-center flex flex-col items-center gap-4 mt-6">
            <span className="text-4xl">🔐</span>
            <h3 className="text-2xl font-semibold text-gray-900">
              Log in to view recruitment listings
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              Sign in to browse employers and candidates, view contact details,
              and connect directly.
            </p>
            <Link
              href={loginHref}
              className="px-6 py-2 rounded-full bg-[#F4D300] text-[#181818] font-semibold shadow hover:bg-yellow-400 transition"
            >
              Log in to continue
            </Link>
          </div>
        ) : (
          <>
            {loadingListings ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 bg-white rounded-2xl border border-yellow-100 animate-pulse"
                  />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className="mt-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h2 className="text-xl font-semibold text-[#181818]">
                  No submissions yet
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Be the first to submit a{" "}
                  {activeTab === "EMPLOYER" ? "Employer" : "Employee"} form!
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {submissions.map((s) => (
                    <div key={s.id}>{renderCard(s)}</div>
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
