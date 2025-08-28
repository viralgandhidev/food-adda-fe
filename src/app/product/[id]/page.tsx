"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { FiArrowRight } from "react-icons/fi";
import { authService } from "@/services/auth";

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
  images: ProductImage[];
  is_veg: boolean;
  brand?: string;
  category_name?: string;
  supplier?: { id: string; name: string };
  specs?: Record<string, string>;
  seller_first_name?: string;
  seller_last_name?: string;
  seller_id?: string;
  preparation_time?: number;
  power_output?: string;
  capacity?: string;
  material?: string;
  voltage?: string;
  weight?: string;
  dimensions?: string;
  metrics?: { id: string; key: string; value: string }[];
}

const DEFAULT_PRODUCT_IMAGE = "/images/default-product.jpg";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");

function getFullImageUrl(imageUrl?: string) {
  if (imageUrl?.startsWith("/uploads/")) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }
  return imageUrl || DEFAULT_PRODUCT_IMAGE;
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savedSeller, setSavedSeller] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/products/${id}`).then(async (res) => {
      const prod = res.data.data as Product;
      setProduct(prod);
      try {
        const [isProd, isSupp] = await Promise.all([
          authService.isProductSaved(String(id)).catch(() => false),
          prod?.seller_id
            ? authService
                .isSupplierSaved(String(prod.seller_id))
                .catch(() => false)
            : Promise.resolve(false),
        ]);
        setSaved(Boolean(isProd));
        setSavedSeller(Boolean(isSupp));
      } catch {}
      setLoading(false);
    });
  }, [id]);

  if (loading || !product) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD600]"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: "default", image_url: "/images/default-product.jpg", order: 0 }];
  const sellerName =
    `${product.seller_first_name || ""} ${
      product.seller_last_name || ""
    }`.trim() || "Unknown Seller";

  return (
    <ProtectedRoute>
      <MainLayout>
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 min-h-[80vh]">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Image Gallery */}
            <div className="flex flex-row lg:flex-col gap-3 items-center">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  className={`border-2 rounded-lg overflow-hidden w-12 h-12 flex items-center justify-center transition-all bg-white ${
                    selectedImg === idx
                      ? "border-[#FFD600] shadow"
                      : "border-transparent"
                  } hover:border-[#FFD600]`}
                  onClick={() => setSelectedImg(idx)}
                >
                  <Image
                    src={getFullImageUrl(img.image_url)}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
            {/* Main Image */}
            <div className="flex-1 flex items-start justify-center min-w-[320px]">
              <div className="relative w-[340px] h-[260px] md:w-[420px] md:h-[320px] bg-[#F5F6FA] overflow-hidden flex items-center justify-center">
                <Image
                  src={getFullImageUrl(images[selectedImg].image_url)}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
                    saved ? "bg-red-500" : "bg-white"
                  }`}
                  onClick={async () => {
                    try {
                      if (saved) {
                        await authService.unsaveProduct(String(id));
                        setSaved(false);
                      } else {
                        await authService.saveProduct(String(id));
                        setSaved(true);
                      }
                    } catch {}
                  }}
                  aria-label={saved ? "Unsave product" : "Save product"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={saved ? "#fff" : "none"}
                    stroke={saved ? "#fff" : "#ef4444"}
                    strokeWidth="2"
                    className="w-5 h-5"
                  >
                    <path d="M12 21s-6.716-4.632-9.333-7.25A5.667 5.667 0 1 1 12 6.333 5.667 5.667 0 1 1 21.333 13.75C18.716 16.368 12 21 12 21z" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Product Info */}
            <div className="flex-1 flex flex-col gap-2 max-w-xl">
              {/* Category badge */}
              {product.category_name && (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full w-fit">
                  {product.category_name}
                </span>
              )}
              {/* Title */}
              <h1 className="text-3xl font-extrabold text-[#181818] leading-tight mb-2">
                {product.name}
              </h1>
              {/* Seller Card (Figma style) */}
              <div className="flex items-center justify-between bg-[#FFFCE9] rounded-xl px-5 py-3 mb-3 w-full">
                <span className="font-medium text-base text-[#181818]">
                  {sellerName}
                </span>
                <div className="flex items-center gap-3">
                  {product.seller_id && (
                    <Link
                      href={`/seller/${product.seller_id}`}
                      className="flex items-center gap-2 font-semibold text-[#181818] hover:underline text-sm"
                    >
                      View Supplier <FiArrowRight size={18} />
                    </Link>
                  )}
                  {product.seller_id && (
                    <button
                      type="button"
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${
                        savedSeller ? "bg-red-500" : "bg-white"
                      }`}
                      onClick={async () => {
                        try {
                          if (savedSeller) {
                            await authService.unsaveSupplier(
                              String(product.seller_id)
                            );
                            setSavedSeller(false);
                          } else {
                            await authService.saveSupplier(
                              String(product.seller_id)
                            );
                            setSavedSeller(true);
                          }
                        } catch {}
                      }}
                      aria-label={
                        savedSeller ? "Unsave supplier" : "Save supplier"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={savedSeller ? "#fff" : "none"}
                        stroke={savedSeller ? "#fff" : "#ef4444"}
                        strokeWidth="2"
                        className="w-5 h-5"
                      >
                        <path d="M12 21s-6.716-4.632-9.333-7.25A5.667 5.667 0 1 1 12 6.333 5.667 5.667 0 1 1 21.333 13.75C18.716 16.368 12 21 12 21z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Description */}
              <p className="text-[#252C32] text-sm leading-relaxed my-3 max-w-2xl">
                {product.description}
              </p>
              {/* Specs (vertical list, bold labels) */}
              {product.metrics && product.metrics.length > 0 && (
                <div className="mb-4 space-y-1 text-[#252C32] text-sm">
                  {product.metrics.map((metric) => (
                    <div key={metric.id}>
                      <span className="font-bold">{metric.key}:</span>{" "}
                      {metric.value}
                    </div>
                  ))}
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex gap-4 mt-10">
                <button className="flex-1 border-2 border-gray-200 rounded-full px-6 py-3 font-semibold text-gray-800 bg-white hover:bg-gray-50 transition text-base shadow-sm">
                  Request Quote
                </button>
                <button className="flex-1 rounded-full px-6 py-3 font-semibold text-[#1C1A1A] bg-[#F4D300] hover:bg-yellow-400 transition text-base shadow-sm">
                  Chat Now
                </button>
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    </ProtectedRoute>
  );
}
