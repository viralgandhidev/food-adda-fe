"use client";
import { useState } from "react";
import { apiMultipart } from "@/lib/api";
import {
  selectClass,
  textInputClass,
  fileInputClass,
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
      className="border rounded-lg px-3 py-2"
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

export default function HoReCaFormPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<any>({});

  const submit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("form_type", "HORECA");
      fd.append("contact_name", form.establishment_name || form.name || "");
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
    <div className="min-h-screen bg-[#FFFEF7] flex items-start justify-center py-16">
      <div className="w-full max-w-4xl">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-sm text-gray-500">Subscribe</h2>
            <h1 className="text-4xl font-extrabold text-[#181818]">HoReCa</h1>
          </div>
          <a
            href={`/forms/submissions?type=HORECA`}
            className="text-sm font-semibold text-[#111827] underline underline-offset-4"
          >
            View submissions
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Please fill out this form to subscribe with us.
        </p>

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
                  <select
                    className={selectClass}
                    value={form.country || ""}
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
                    onChange={(e) => setForm({ ...form, gst: e.target.value })}
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
                      setForm({ ...form, menu_files: e.target.files })
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
                      setForm({ ...form, photos: e.target.files })
                    }
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
                  className="bg-[#FFD600] text-[#181818] font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-400"
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
