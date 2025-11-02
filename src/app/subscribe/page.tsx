"use client";

import Script from "next/script";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiCheck, FiX } from "react-icons/fi";

type PlanCode = "SILVER" | "GOLD";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
};

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
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

export default function SubscribePage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);

  const startCheckout = useCallback(
    async (plan: PlanCode) => {
      try {
        setLoadingPlan(plan);
        // Initiate order
        const { data } = await api.post("/subscriptions/checkout", { plan });
        const order: RazorpayOrder = data.data.order;
        const keyId: string = data.data.keyId;

        if (!window.Razorpay) {
          toast.error("Payment SDK not loaded. Please retry.");
          return;
        }

        const options: RazorpayOptions = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "FoodAdda.in",
          description: `${plan} Subscription`,
          order_id: order.id,
          handler: async (response: RazorpayHandlerResponse) => {
            try {
              await api.post("/subscriptions/verify", response);
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
      } catch (err: any) {
        const code: string | undefined = err?.response?.data?.code;
        if (code === "FORM_REQUIRED") {
          toast.message("Please complete your business form first");
          router.push("/forms/B2B");
          return;
        }
        if (code === "APPROVAL_REQUIRED") {
          toast.message("Your form is pending admin approval");
          return;
        }
        if (err?.response?.status === 401) {
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
          disabled={loadingPlan === p.code}
          className="mt-4 w-full rounded-md bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 disabled:opacity-60"
        >
          {loadingPlan === p.code ? "Starting..." : "Subscribe"}
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
    [loadingPlan, startCheckout]
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <Header />
      <main className="max-w-7xl mx-auto px-4 pt-12 pb-20">
        <div className="grid md:grid-cols-[minmax(280px,1fr)_360px_360px] gap-10 items-start">
          <div className="max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Subscribe to your{" "}
              <span className="text-yellow-400">one-stop</span> platform for all
              food industry needs.
            </h1>
            <p className="mt-4 text-gray-300 max-w-md">
              From small businesses to large-scale enterprises, we empower food
              industry professionals & businesses with a network to source,
              connect, and grow.
            </p>
          </div>
          {plans.map((p) => (
            <Card key={p.code} {...p} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
