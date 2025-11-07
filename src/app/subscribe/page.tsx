"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { api, apiMultipart } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiCheck, FiX } from "react-icons/fi";
import { useAuthStore } from "@/store/auth";
import {
  textInputClass,
  selectClass,
  fileInputClass,
  textAreaClass,
} from "@/components/forms/fieldClasses";

type PlanCode = "SILVER" | "GOLD";

// kept for legacy one-time orders (unused with recurring flow)

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
type RazorpaySubAuthResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};
type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

type RazorpayOptions = {
  key: string;
  name: string;
  description: string;
  // One-time orders use order_id; subscriptions use subscription_id
  order_id?: string;
  subscription_id?: string;
  handler: (
    response: RazorpayHandlerResponse | RazorpaySubAuthResponse
  ) => void;
  theme?: { color?: string };
  prefill?: Record<string, string>;
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type Feature = { label: string; included: boolean };

const plans: {
  code: PlanCode;
  label: string;
  priceDisplay: string;
  amountPaise: number;
  features: Feature[];
}[] = [
  {
    code: "SILVER",
    label: "Silver",
    priceDisplay: "₹5,900 /Month (incl. GST)",
    amountPaise: 5900 * 100,
    features: [
      { label: "Limited Photo Upload (Up to 3)", included: true },
      { label: "Access to Email Address", included: true },
      { label: "Access to Minimum Order Quantity (MoQ)", included: true },
      { label: "Video Upload (Up to 1)", included: true },
      { label: "Access to Phone Number", included: false },
      { label: "Access to Business Catalog", included: false },
      { label: "Unlimited Browsing", included: false },
      { label: "Direct Chat", included: false },
    ],
  },
  {
    code: "GOLD",
    label: "Gold",
    priceDisplay: "₹10,620 /Month (incl. GST)",
    amountPaise: 10620 * 100,
    features: [
      { label: "Unlimited Photos", included: true },
      { label: "Access to Email Address", included: true },
      { label: "Access to Minimum Order Quantity (MoQ)", included: true },
      { label: "Unlimited Video Upload", included: true },
      { label: "Access to Phone Number", included: true },
      { label: "Access to Business Catalog", included: true },
      { label: "Unlimited Product Browsing", included: true },
      { label: "Direct Chat", included: true },
    ],
  },
];

type FormType = "B2B" | "B2C" | "HORECA" | "FRANCHISE" | "RECRUITMENT";
type FormValue = string | FileList | boolean | undefined;
type FormData = Record<string, FormValue>;

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

function B2BForm({
  form,
  setForm,
  onSubmit,
  loading,
  alsoB2C,
  setAlsoB2C,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onSubmit: () => void;
  loading: boolean;
  alsoB2C: boolean;
  setAlsoB2C: (v: boolean) => void;
  b2cFormData: FormData;
}) {
  // Ensure email/phone prefill via API even on hard refresh
  useEffect(() => {
    const prefill = async () => {
      try {
        const res = await api.get("/auth/me");
        const profile = res.data?.data as
          | { email?: string; phone_number?: string }
          | undefined;
        const next: FormData = { ...form };
        if (profile?.email && !next.email) next.email = profile.email;
        if (profile?.phone_number && !next.phone)
          next.phone = profile.phone_number;
        setForm(next);
      } catch {
        // ignore
      }
    };
    prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name">
          <input
            className={textInputClass}
            value={(form.name as string) || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
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
        <Field label="URL (Website)">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label="Google Location">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Link"
          />
        </Field>
        <Field label="WhatsApp No.">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
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
            onChange={(e) => setForm({ ...form, fssai: e.target.value })}
            placeholder="FSSAI"
          />
        </Field>
        <Field label="Product Description">
          <textarea
            className={textAreaClass}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            placeholder="Title"
          />
        </Field>
        <Field label="Upload Photos">
          <input
            type="file"
            multiple
            className={fileInputClass}
            onChange={(e) =>
              setForm({ ...form, photos: e.target.files || undefined })
            }
          />
        </Field>
        <Field label="MOQ Required">
          <input
            type="number"
            min={0}
            className={textInputClass}
            onChange={(e) => setForm({ ...form, moq: e.target.value })}
            placeholder="Minimum order quantity"
          />
        </Field>
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={alsoB2C}
            onChange={(e) => setAlsoB2C(e.target.checked)}
          />
          <span>Also subscribe for B2C market</span>
        </label>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
            />
            <span>I read & agreed to the terms and conditions</span>
          </label>
          <button
            disabled={loading || !form.agreed}
            onClick={onSubmit}
            className="bg-[#F4D300] text-[#181818] font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function B2CForm({
  form,
  setForm,
  onSubmit,
  loading,
  alsoB2B,
  setAlsoB2B,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onSubmit: () => void;
  loading: boolean;
  alsoB2B: boolean;
  setAlsoB2B: (v: boolean) => void;
  b2bFormData: FormData;
}) {
  // Ensure email/phone prefill via API even on hard refresh
  useEffect(() => {
    const prefill = async () => {
      try {
        const res = await api.get("/auth/me");
        const profile = res.data?.data as
          | { email?: string; phone_number?: string }
          | undefined;
        const next: FormData = { ...form };
        if (profile?.email && !next.email) next.email = profile.email;
        if (profile?.phone_number && !next.phone)
          next.phone = profile.phone_number;
        setForm(next);
      } catch {
        // ignore
      }
    };
    prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
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
        <Field label="URL (Website)">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label="Google Location">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Link"
          />
        </Field>
        <Field label="WhatsApp No.">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
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
            onChange={(e) => setForm({ ...form, fssai: e.target.value })}
            placeholder="FSSAI"
          />
        </Field>
        <Field label="Product Description">
          <textarea
            className={textAreaClass}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            placeholder="Title"
          />
        </Field>
        <Field label="Upload Photos">
          <input
            type="file"
            multiple
            className={fileInputClass}
            onChange={(e) =>
              setForm({ ...form, photos: e.target.files || undefined })
            }
          />
        </Field>
        <Field label="MOQ Required">
          <input
            type="number"
            min={0}
            className={textInputClass}
            onChange={(e) => setForm({ ...form, moq: e.target.value })}
            placeholder="Minimum order quantity"
          />
        </Field>
      </div>

      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={alsoB2B}
            onChange={(e) => setAlsoB2B(e.target.checked)}
          />
          <span>Also subscribe for B2B market</span>
        </label>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
            />
            <span>I read & agreed to the terms and conditions</span>
          </label>
          <button
            disabled={loading || !form.agreed}
            onClick={onSubmit}
            className="bg-[#F4D300] text-[#181818] font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HORECAForm({
  form,
  setForm,
  onSubmit,
  loading,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-8">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Establishment Details
      </h3>
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
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            placeholder="State"
          />
        </Field>
        <Field label="Country">
          <select
            className={selectClass}
            value={(form.country as string) || ""}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
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
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label="Google Location">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Link"
          />
        </Field>
        <Field label="WhatsApp No.">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
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
            onChange={(e) => setForm({ ...form, fssai: e.target.value })}
            placeholder="FSSAI"
          />
        </Field>
        <Field label="Menu">
          <input
            type="file"
            multiple
            className={fileInputClass}
            onChange={(e) =>
              setForm({ ...form, menu_files: e.target.files || undefined })
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
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            placeholder="Title"
          />
        </Field>
        <Field label="Upload Photos">
          <input
            type="file"
            multiple
            className={fileInputClass}
            onChange={(e) =>
              setForm({ ...form, photos: e.target.files || undefined })
            }
          />
        </Field>
        <Field label="Email">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone">
          <input
            className={textInputClass}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 555 000 0000"
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
          />
          <span>I read & agreed to the terms and conditions</span>
        </label>
        <button
          disabled={loading || !form.agreed}
          onClick={onSubmit}
          className="bg-[#F4D300] text-[#181818] font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [activeTab, setActiveTab] = useState<FormType>("B2B");
  type SubscriptionRecord = {
    id: number;
    plan_code: PlanCode;
    plan_label?: string;
    status: "ACTIVE" | "PENDING_PAYMENT" | "FAILED" | "CANCELLED";
    created_at: string;
    razorpay_payment_id?: string;
  } | null;
  const [subscription, setSubscription] = useState<SubscriptionRecord>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<{
    hasForm: boolean;
    loading: boolean;
  }>({ hasForm: false, loading: true });
  const [showForms, setShowForms] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    email?: string;
    phone_number?: string;
  }>({});
  const [formData, setFormData] = useState<Record<FormType, FormData>>({
    B2B: {},
    B2C: {},
    HORECA: {},
    FRANCHISE: {},
    RECRUITMENT: {},
  });
  const [formLoading, setFormLoading] = useState<Record<FormType, boolean>>({
    B2B: false,
    B2C: false,
    HORECA: false,
    FRANCHISE: false,
    RECRUITMENT: false,
  });
  const [alsoB2C, setAlsoB2C] = useState(false);
  const [alsoB2B, setAlsoB2B] = useState(false);

  // Fetch user profile to pre-fill email and phone
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        // If no user, set email from auth store if available
        if (user?.email) {
          setUserProfile({ email: user.email });
        }
        return;
      }

      try {
        console.log("Fetching user profile from /auth/me for user:", user.id);
        // Get user profile directly from /auth/me endpoint which returns full user data from users table
        const profileRes = await api.get("/auth/me");
        const profile = profileRes.data.data;
        console.log("User profile received:", profile);
        if (profile) {
          const profileData = {
            email: profile.email || user.email || "",
            phone_number: profile.phone_number || "",
          };
          console.log("Setting userProfile to:", profileData);
          setUserProfile(profileData);
        } else {
          setUserProfile({
            email: user.email || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        // If profile fetch fails, use email from auth store
        setUserProfile({
          email: user.email || "",
        });
      }
    };
    fetchUserProfile();
  }, [user]);

  // Pre-fill forms with user data
  useEffect(() => {
    console.log("userProfile changed:", userProfile);
    if (userProfile.email || userProfile.phone_number) {
      setFormData((prev) => {
        const updated = { ...prev };
        // Pre-fill all forms with user data
        (
          ["B2B", "B2C", "HORECA", "FRANCHISE", "RECRUITMENT"] as FormType[]
        ).forEach((formType) => {
          updated[formType] = {
            ...(updated[formType] || {}),
            // Always set email and phone if available, even if form already has values
            ...(userProfile.email ? { email: userProfile.email } : {}),
            ...(userProfile.phone_number
              ? { phone: userProfile.phone_number }
              : {}),
          };
          console.log(`Pre-filled ${formType} form:`, updated[formType]);
        });
        return updated;
      });
    }
  }, [userProfile]);

  // Check if user has filled any form
  useEffect(() => {
    const checkFormStatus = async () => {
      try {
        const res = await api.get("/forms/my-status");
        const data = res.data.data;
        if (data && data.status === "APPROVED") {
          setFormStatus({ hasForm: true, loading: false });
          setShowForms(false);
        } else {
          setFormStatus({ hasForm: false, loading: false });
          setShowForms(true);
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "status" in err.response &&
          err.response.status === 401
        ) {
          router.push("/login?next=/subscribe");
          return;
        }
        // If no form found, show forms
        setFormStatus({ hasForm: false, loading: false });
        setShowForms(true);
      }
    };
    checkFormStatus();
  }, [router]);

  // Fetch current subscription
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/subscriptions/me");
        setSubscription(res.data?.data || null);
      } catch {
        // ignore 401 here; subscribe page will redirect on interactions
        setSubscription(null);
      } finally {
        setSubLoading(false);
      }
    })();
  }, []);

  const isSubscribed =
    !!subscription &&
    (subscription.status === "ACTIVE" ||
      subscription.status === "PENDING_PAYMENT");

  const submitForm = useCallback(
    async (formType: FormType) => {
      try {
        setFormLoading((prev) => ({ ...prev, [formType]: true }));

        // Submit the primary form
        const form = formData[formType];
        const fd = new FormData();
        fd.append("form_type", formType);

        if (formType === "B2B") {
          fd.append("contact_name", String(form.name || ""));
          fd.append("contact_email", String(form.email || ""));
          fd.append("contact_phone", String(form.phone || ""));
        } else if (formType === "B2C") {
          fd.append(
            "contact_name",
            String(form.name || form.company_name || "")
          );
          fd.append("contact_email", String(form.email || ""));
          fd.append("contact_phone", String(form.phone || ""));
        } else if (formType === "HORECA") {
          fd.append(
            "contact_name",
            String(form.establishment_name || form.name || "")
          );
          fd.append("contact_email", String(form.email || ""));
          fd.append("contact_phone", String(form.phone || ""));
        } else if (formType === "FRANCHISE") {
          fd.append(
            "contact_name",
            String(form.name || form.company_name || "")
          );
          fd.append("contact_email", String(form.email || ""));
          fd.append("contact_phone", String(form.phone || ""));
          fd.append(
            "franchise_kind",
            String((form.franchise_kind as string) || "BRAND")
          );
        } else if (formType === "RECRUITMENT") {
          fd.append("contact_name", String(form.name || ""));
          fd.append("contact_email", String(form.email || ""));
          fd.append("contact_phone", String(form.phone || ""));
          fd.append(
            "recruitment_kind",
            String((form.recruitment_kind as string) || "EMPLOYER")
          );
        }

        Object.entries(form).forEach(([k, v]) => {
          if (k === "agreed" || k === "alsoB2C" || k === "alsoB2B") return; // Skip internal flags
          if (v instanceof FileList) {
            Array.from(v).forEach((file) => fd.append(k, file));
          } else if (typeof v === "string" && v) {
            fd.append(k, v);
          } else if (typeof v === "boolean") {
            fd.append(k, v.toString());
          }
        });

        await apiMultipart.post("/forms/submit", fd);

        // If user wants to also submit the other market form
        if (formType === "B2B" && alsoB2C) {
          setFormLoading((prev) => ({ ...prev, B2C: true }));
          const b2cForm = { ...formData.B2C, ...form }; // Merge B2B data into B2C
          // Use B2B name as name for B2C if B2C name is empty
          if (!b2cForm.name && form.name) {
            b2cForm.name = form.name as string;
          }

          const b2cFd = new FormData();
          b2cFd.append("form_type", "B2C");
          b2cFd.append("contact_name", String(b2cForm.name || form.name || ""));
          b2cFd.append(
            "contact_email",
            String(b2cForm.email || form.email || "")
          );
          b2cFd.append(
            "contact_phone",
            String(b2cForm.phone || form.phone || "")
          );

          Object.entries(b2cForm).forEach(([k, v]) => {
            if (k === "agreed" || k === "alsoB2C" || k === "alsoB2B") return;
            if (v instanceof FileList) {
              Array.from(v).forEach((file) => b2cFd.append(k, file));
            } else if (typeof v === "string" && v) {
              b2cFd.append(k, v);
            } else if (typeof v === "boolean") {
              b2cFd.append(k, v.toString());
            }
          });

          await apiMultipart.post("/forms/submit", b2cFd);
          setFormLoading((prev) => ({ ...prev, B2C: false }));
        } else if (formType === "B2C" && alsoB2B) {
          setFormLoading((prev) => ({ ...prev, B2B: true }));
          const b2bForm = { ...formData.B2B, ...form }; // Merge B2C data into B2B
          // Use B2C name as name for B2B if B2B name is empty
          if (!b2bForm.name && form.name) {
            b2bForm.name = form.name;
          }

          const b2bFd = new FormData();
          b2bFd.append("form_type", "B2B");
          b2bFd.append("contact_name", String(b2bForm.name || form.name || ""));
          b2bFd.append(
            "contact_email",
            String(b2bForm.email || form.email || "")
          );
          b2bFd.append(
            "contact_phone",
            String(b2bForm.phone || form.phone || "")
          );

          Object.entries(b2bForm).forEach(([k, v]) => {
            if (k === "agreed" || k === "alsoB2C" || k === "alsoB2B") return;
            if (v instanceof FileList) {
              Array.from(v).forEach((file) => b2bFd.append(k, file));
            } else if (typeof v === "string" && v) {
              b2bFd.append(k, v);
            } else if (typeof v === "boolean") {
              b2bFd.append(k, v.toString());
            }
          });

          await apiMultipart.post("/forms/submit", b2bFd);
          setFormLoading((prev) => ({ ...prev, B2B: false }));
        }

        toast.success("Form(s) submitted successfully!");
        // Redirect to subscription plans
        setShowForms(false);
        setFormStatus({ hasForm: true, loading: false });
      } catch {
        toast.error("Failed to submit form. Please try again.");
      } finally {
        setFormLoading((prev) => ({ ...prev, [formType]: false }));
      }
    },
    [formData, alsoB2C, alsoB2B]
  );

  const startCheckout = useCallback(
    async (plan: PlanCode) => {
      try {
        setLoadingPlan(plan);
        // Initiate recurring subscription
        const { data } = await api.post("/subscriptions/start", { plan });
        const sub = data.data.subscription;
        const keyId: string = data.data.keyId;

        if (!window.Razorpay) {
          toast.error("Payment SDK not loaded. Please retry.");
          return;
        }

        const options: RazorpayOptions = {
          key: keyId,
          name: "FoodAdda.in",
          description: `${plan} Subscription`,
          subscription_id: sub.id,
          handler: async (
            response: RazorpayHandlerResponse | RazorpaySubAuthResponse
          ) => {
            try {
              // For subscription flow we expect subscription_id
              const payload =
                "razorpay_subscription_id" in response
                  ? response
                  : ({
                      razorpay_payment_id: response.razorpay_payment_id,
                      // fallback: order flow does not apply; send empty subscription id to fail fast
                      razorpay_subscription_id: "",
                      razorpay_signature: response.razorpay_signature,
                    } as RazorpaySubAuthResponse);
              await api.post("/subscriptions/authorize/verify", payload);
              toast.success("Subscription activated!");
              router.push("/dashboard");
            } catch {
              toast.error("Payment verification failed");
            }
          },
          theme: { color: "#facc15" },
          prefill: {},
        };

        const RazorpayCtor = window.Razorpay as RazorpayConstructor;
        const rzp = new RazorpayCtor(options);
        rzp.open();
      } catch (err: unknown) {
        const code: string | undefined =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "code" in err.response.data &&
          typeof err.response.data.code === "string"
            ? err.response.data.code
            : undefined;
        const message: string | undefined =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "message" in err.response.data &&
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : undefined;
        if (code === "FORM_REQUIRED") {
          setShowForms(true);
          return;
        }
        if (code === "APPROVAL_REQUIRED") {
          toast.message("Your form is pending admin approval");
          return;
        }
        // Fallback to one-time order flow when recurring plans aren't configured/approved yet
        if (message === "Plan not configured") {
          try {
            const { data } = await api.post("/subscriptions/checkout", {
              plan,
            });
            const order: RazorpayOrder = data.data.order;
            const keyId: string = data.data.keyId;
            if (!window.Razorpay) {
              toast.error("Payment SDK not loaded. Please retry.");
              return;
            }
            const options: RazorpayOptions = {
              key: keyId,
              name: "FoodAdda.in",
              description: `${plan} Subscription`,
              order_id: order.id,
              handler: async (
                response: RazorpayHandlerResponse | RazorpaySubAuthResponse
              ) => {
                try {
                  // In order flow we expect order fields; if not present, fail
                  if ("razorpay_order_id" in response) {
                    await api.post("/subscriptions/verify", response);
                  } else {
                    throw new Error("Invalid response for order payment");
                  }
                  toast.success("Subscription activated!");
                  router.push("/dashboard");
                } catch {
                  toast.error("Payment verification failed");
                }
              },
              theme: { color: "#facc15" },
              prefill: {},
            };
            const RazorpayCtor = window.Razorpay as RazorpayConstructor;
            const rzp = new RazorpayCtor(options);
            rzp.open();
            return;
          } catch {
            // fall-through to generic error
          }
        }
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "status" in err.response &&
          err.response.status === 401
        ) {
          router.push("/login?next=/subscribe");
          return;
        }
        toast.error("Unable to start payment. Try again later.");
      } finally {
        setLoadingPlan(null);
      }
    },
    [router]
  );

  const Card = useCallback(
    (p: (typeof plans)[number]) => (
      <div className="w-full md:w-[360px] bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="text-gray-600 text-sm">{p.label}</div>
        <div className="text-3xl font-bold mt-2 text-gray-900">
          {p.priceDisplay}
        </div>
        <button
          onClick={() => startCheckout(p.code)}
          disabled={loadingPlan === p.code || isSubscribed}
          className="mt-4 w-full rounded-md bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 disabled:opacity-60"
        >
          {isSubscribed
            ? "Already Subscribed"
            : loadingPlan === p.code
            ? "Starting..."
            : "Subscribe"}
        </button>
        <ul className="mt-6 space-y-3 text-sm">
          {p.features.map((f) => (
            <li key={f.label} className="flex items-start gap-3">
              <span
                className={
                  f.included
                    ? "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-black"
                    : "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500"
                }
                aria-hidden
              >
                {f.included ? <FiCheck size={14} /> : <FiX size={14} />}
              </span>
              <span className={f.included ? "text-gray-800" : "text-gray-400"}>
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
    [loadingPlan, startCheckout, isSubscribed]
  );

  if (formStatus.loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <Header />
      <main className="max-w-7xl mx-auto px-4 pt-12 pb-20">
        {subLoading ? (
          <div>Loading subscription...</div>
        ) : isSubscribed ? (
          <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold">Your Subscription</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Plan:</span>{" "}
                {subscription.plan_label || subscription.plan_code}
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{" "}
                {subscription.status}
              </div>
              <div>
                <span className="text-gray-500">Started:</span>{" "}
                {new Date(subscription.created_at).toLocaleString()}
              </div>
              <div>
                <span className="text-gray-500">Next renewal:</span>{" "}
                {new Date(
                  new Date(subscription.created_at).getTime() +
                    30 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </div>
              {subscription.razorpay_payment_id && (
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Payment ID:</span>{" "}
                  {subscription.razorpay_payment_id}
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              You already have an active subscription. Only one active
              subscription is allowed at a time.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 inline-flex rounded-full bg-[#F4D300] px-6 py-2 font-semibold text-[#181818]"
            >
              Go to dashboard
            </button>
          </div>
        ) : showForms ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Complete Your Business Form
              </h1>
              <p className="mt-4 text-gray-300">
                Please fill out one of the forms below to proceed with
                subscription.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-700">
              {(
                [
                  "B2B",
                  "B2C",
                  "HORECA",
                  "FRANCHISE",
                  "RECRUITMENT",
                ] as FormType[]
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold transition-colors ${
                    activeTab === tab
                      ? "text-yellow-400 border-b-2 border-yellow-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="mt-6">
              {activeTab === "B2B" && (
                <B2BForm
                  form={formData.B2B}
                  setForm={(f) => setFormData((prev) => ({ ...prev, B2B: f }))}
                  onSubmit={() => submitForm("B2B")}
                  loading={formLoading.B2B || formLoading.B2C}
                  alsoB2C={alsoB2C}
                  setAlsoB2C={setAlsoB2C}
                  b2cFormData={formData.B2C}
                />
              )}
              {activeTab === "B2C" && (
                <B2CForm
                  form={formData.B2C}
                  setForm={(f) => setFormData((prev) => ({ ...prev, B2C: f }))}
                  onSubmit={() => submitForm("B2C")}
                  loading={formLoading.B2C || formLoading.B2B}
                  alsoB2B={alsoB2B}
                  setAlsoB2B={setAlsoB2B}
                  b2bFormData={formData.B2B}
                />
              )}
              {activeTab === "HORECA" && (
                <HORECAForm
                  form={formData.HORECA}
                  setForm={(f) =>
                    setFormData((prev) => ({ ...prev, HORECA: f }))
                  }
                  onSubmit={() => submitForm("HORECA")}
                  loading={formLoading.HORECA}
                />
              )}
              {activeTab === "FRANCHISE" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Type">
                    <select
                      className={selectClass}
                      value={
                        (formData.FRANCHISE.franchise_kind as string) || "BRAND"
                      }
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          FRANCHISE: {
                            ...p.FRANCHISE,
                            franchise_kind: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="BRAND">Brand</option>
                      <option value="SEEKER">Franchise Seeker</option>
                    </select>
                  </Field>
                  <Field label="Name / Company">
                    <input
                      className={textInputClass}
                      value={(formData.FRANCHISE.name as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          FRANCHISE: { ...p.FRANCHISE, name: e.target.value },
                        }))
                      }
                      placeholder="Your brand or name"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={textInputClass}
                      value={(formData.FRANCHISE.email as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          FRANCHISE: { ...p.FRANCHISE, email: e.target.value },
                        }))
                      }
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={textInputClass}
                      value={(formData.FRANCHISE.phone as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          FRANCHISE: { ...p.FRANCHISE, phone: e.target.value },
                        }))
                      }
                      placeholder="+91…"
                    />
                  </Field>
                  <Field label="Website (optional)">
                    <input
                      className={textInputClass}
                      value={(formData.FRANCHISE.website as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          FRANCHISE: {
                            ...p.FRANCHISE,
                            website: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://"
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className={textAreaClass}
                      value={(formData.FRANCHISE.description as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          FRANCHISE: {
                            ...p.FRANCHISE,
                            description: e.target.value,
                          },
                        }))
                      }
                      placeholder="Tell us about brand/opportunity"
                    />
                  </Field>
                  <div className="md:col-span-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            FRANCHISE: {
                              ...p.FRANCHISE,
                              agreed: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>I agree to Terms & Conditions</span>
                    </label>
                    <button
                      onClick={() => submitForm("FRANCHISE")}
                      disabled={
                        formLoading.FRANCHISE || !formData.FRANCHISE.agreed
                      }
                      className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-500 disabled:opacity-60"
                    >
                      {formLoading.FRANCHISE ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
              {activeTab === "RECRUITMENT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Type">
                    <select
                      className={selectClass}
                      value={
                        (formData.RECRUITMENT.recruitment_kind as string) ||
                        "EMPLOYER"
                      }
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          RECRUITMENT: {
                            ...p.RECRUITMENT,
                            recruitment_kind: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="EMPLOYER">Employer</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </Field>
                  <Field label="Name / Company">
                    <input
                      className={textInputClass}
                      value={(formData.RECRUITMENT.name as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          RECRUITMENT: {
                            ...p.RECRUITMENT,
                            name: e.target.value,
                          },
                        }))
                      }
                      placeholder="Your name or company"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={textInputClass}
                      value={(formData.RECRUITMENT.email as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          RECRUITMENT: {
                            ...p.RECRUITMENT,
                            email: e.target.value,
                          },
                        }))
                      }
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={textInputClass}
                      value={(formData.RECRUITMENT.phone as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          RECRUITMENT: {
                            ...p.RECRUITMENT,
                            phone: e.target.value,
                          },
                        }))
                      }
                      placeholder="+91…"
                    />
                  </Field>
                  <Field label="Role / Profile Title">
                    <input
                      className={textInputClass}
                      value={(formData.RECRUITMENT.role_title as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          RECRUITMENT: {
                            ...p.RECRUITMENT,
                            role_title: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g., Store Manager"
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className={textAreaClass}
                      value={(formData.RECRUITMENT.description as string) || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          RECRUITMENT: {
                            ...p.RECRUITMENT,
                            description: e.target.value,
                          },
                        }))
                      }
                      placeholder="Job details or profile summary"
                    />
                  </Field>
                  <div className="md:col-span-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            RECRUITMENT: {
                              ...p.RECRUITMENT,
                              agreed: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>I agree to Terms & Conditions</span>
                    </label>
                    <button
                      onClick={() => submitForm("RECRUITMENT")}
                      disabled={
                        formLoading.RECRUITMENT || !formData.RECRUITMENT.agreed
                      }
                      className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-500 disabled:opacity-60"
                    >
                      {formLoading.RECRUITMENT ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-[minmax(280px,1fr)_360px_360px] gap-10 items-start">
            <div className="max-w-md">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Subscribe to your{" "}
                <span className="text-yellow-400">one-stop</span> platform for
                all food industry needs.
              </h1>
              <p className="mt-4 text-gray-300 max-w-md">
                From small businesses to large-scale enterprises, we empower
                food industry professionals & businesses with a network to
                source, connect, and grow.
              </p>
            </div>
            {plans.map((p) => (
              <Card key={p.code} {...p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
