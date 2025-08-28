"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import {
  FiArrowRight,
  FiPhone,
  FiMail,
  FiMapPin,
  FiUser,
} from "react-icons/fi";
import { authService } from "@/services/auth";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  category_name?: string;
  images?: { image_url: string }[];
}

interface Supplier {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  profile_image_url?: string;
  company_name?: string;
  company_description?: string;
}

const DEFAULT_PROFILE_IMAGE = "/images/default-product.jpg";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");

function getFullImageUrl(imageUrl?: string) {
  if (imageUrl?.startsWith("/uploads/")) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }
  return imageUrl || DEFAULT_PROFILE_IMAGE;
}

export default function SupplierDetailsPage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/suppliers/${id}`),
      api.get(`/suppliers/${id}/products`),
      authService.isSupplierSaved(String(id)).catch(() => false),
    ]).then(([supplierRes, productsRes, isSaved]) => {
      setSupplier(supplierRes.data.data);
      setProducts(productsRes.data.data);
      setSaved(Boolean(isSaved));
      setLoading(false);
    });
  }, [id]);

  if (loading || !supplier) {
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

  const supplierName = `${supplier.first_name} ${supplier.last_name}`.trim();
  const companyName = supplier.company_name || supplierName;

  return (
    <ProtectedRoute>
      <MainLayout>
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 min-h-[80vh]">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Supplier Profile and Info (Left) */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Profile Header */}
              <div className="flex items-start gap-6">
                <div className="relative w-28 h-28 rounded-full border-4 border-yellow-300 shadow-lg overflow-hidden bg-white">
                  <Image
                    src={getFullImageUrl(supplier.profile_image_url)}
                    alt={supplierName}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${
                      saved ? "bg-red-500" : "bg-white"
                    }`}
                    onClick={async () => {
                      try {
                        if (saved) {
                          await authService.unsaveSupplier(String(id));
                          setSaved(false);
                        } else {
                          await authService.saveSupplier(String(id));
                          setSaved(true);
                        }
                      } catch {}
                    }}
                    aria-label={saved ? "Unsave business" : "Save business"}
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
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                      {companyName}
                    </h1>
                    <button
                      type="button"
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${
                        saved ? "bg-red-500" : "bg-white"
                      }`}
                      onClick={async () => {
                        try {
                          if (saved) {
                            await authService.unsaveSupplier(String(id));
                            setSaved(false);
                          } else {
                            await authService.saveSupplier(String(id));
                            setSaved(true);
                          }
                        } catch {}
                      }}
                      aria-label={saved ? "Unsave business" : "Save business"}
                      title={saved ? "Unsave business" : "Save business"}
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
                  <p className="text-base text-gray-600 leading-relaxed">
                    {supplier.company_description || "No description available"}
                  </p>
                </div>
              </div>

              {/* Company Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-yellow-600 mb-4">
                  Company Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Company Name:
                    </span>
                    <p className="text-gray-900">{supplier.company_name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Description:
                    </span>
                    <p className="text-gray-900">
                      {supplier.company_description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-yellow-600 mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <FiUser className="text-yellow-500 text-xl" />
                    <div>
                      <span className="font-semibold text-gray-700">
                        Full Name:
                      </span>
                      <p className="text-gray-900">{supplierName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMail className="text-yellow-500 text-xl" />
                    <div>
                      <span className="font-semibold text-gray-700">
                        Email:
                      </span>
                      <p className="text-gray-900">{supplier.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-yellow-500 text-xl" />
                    <div>
                      <span className="font-semibold text-gray-700">
                        Phone:
                      </span>
                      <p className="text-gray-900">{supplier.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-yellow-500 text-xl" />
                    <div>
                      <span className="font-semibold text-gray-700">
                        Address:
                      </span>
                      <p className="text-gray-900">{supplier.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List (Right) */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-yellow-600 mb-6">
                  Products
                </h2>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((product) => {
                      const productImage =
                        product.images && product.images.length > 0
                          ? product.images[0].image_url
                          : product.image_url;
                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-yellow-400 transition-colors bg-gray-50 hover:bg-yellow-50"
                        >
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={getFullImageUrl(productImage)}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-yellow-700">
                                ₹{product.price.toLocaleString()}
                              </span>
                              <FiArrowRight className="text-gray-400" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No products available
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    </ProtectedRoute>
  );
}
