"use client";
// @ts-nocheck
/* eslint-disable */
import { useState } from "react";
import { apiMultipart } from "@/lib/api";
import {
  textInputClass,
  selectClass,
  textAreaClass,
} from "@/components/forms/fieldClasses";

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

export default function QuoteRequestFormPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string | FileList | boolean>>(
    {}
  );

  const submit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("form_type", "QUOTE_REQUEST");
      fd.append("contact_name", form.name || form.company_name || "");
      fd.append("contact_email", form.email || "");
      fd.append("contact_phone", form.phone || "");
      Object.entries(form).forEach(([k, v]) => {
        if (v instanceof FileList)
          Array.from(v).forEach((f) => fd.append(k, f));
        else if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      await apiMultipart.post("/forms/submit", fd);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-16">
      <div className="w-full max-w-4xl">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-sm text-gray-500">Subscribe</h2>
            <h1 className="text-4xl font-extrabold text-[#181818]">
              Quote Request
            </h1>
          </div>
          <a
            href={`/forms/submissions?type=QUOTE_REQUEST`}
            className="text-sm font-semibold text-[#111827] underline underline-offset-4"
          >
            View submissions
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Please fill out this form to subscribe with us.
        </p>

        <div className="bg-white rounded-2xl shadow p-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
          {submitted ? (
            <div className="text-green-700">
              Thanks! We received your submission.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name / Company">
                  <input
                    className={textInputClass}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name or company"
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={textInputClass}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={textInputClass}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="+1 555 000 0000"
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
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </Field>
                <Field label="Country">
                  <CountrySelect
                    value={form.country}
                    onChange={(v) => setForm({ ...form, country: v })}
                  />
                </Field>
                <Field label="WA No.">
                  <input
                    className={textInputClass}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    placeholder="WhatsApp"
                  />
                </Field>
                <Field label="Requirement">
                  <textarea
                    className={textAreaClass}
                    onChange={(e) =>
                      setForm({ ...form, requirement: e.target.value })
                    }
                    placeholder="Describe your requirement"
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled={loading}
                  onClick={submit}
                  className="bg-[#F4D300] text-[#181818] font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-400"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
