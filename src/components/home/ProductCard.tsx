import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";

interface ProductImage {
  id: string;
  image_url: string;
  order: number;
}

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: ProductImage[];
  isVeg: boolean;
  brand?: string;
  category?: string;
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

export default function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  images = [],
  isVeg,
  brand,
  category,
}: ProductCardProps) {
  const router = useRouter();
  // Use the first image from images array if available, else fallback
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);
  // Hydrate saved state on mount
  // Note: ProductCard is client component; best-effort check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    authService
      .isProductSaved(id)
      .then((isSaved) => setSaved(isSaved))
      .catch(() => {});
    return undefined as unknown as void;
  });
  const displayImage =
    !imgError && images.length > 0
      ? images[0].image_url
      : !imgError && imageUrl
      ? imageUrl
      : DEFAULT_PRODUCT_IMAGE;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => router.push(`/product/${id}`)}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow min-h-[420px] flex flex-col">
        <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center">
          <Image
            src={getFullImageUrl(displayImage)}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
          />
          {/* Save/Unsave heart */}
          <button
            type="button"
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${
              saved ? "bg-red-500" : "bg-white"
            }`}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (saved) {
                  await authService.unsaveProduct(id);
                  setSaved(false);
                } else {
                  await authService.saveProduct(id);
                  setSaved(true);
                }
              } catch {
                // ignore
              }
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
          {/* <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold shadow ${
                isVeg ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
            >
              {isVeg ? "Veg" : "Non-Veg"}
            </span>
          </div> */}
        </div>
        <div className="flex-1 flex flex-col p-4 min-h-[180px]">
          {/* Category if available */}
          {category && (
            <div className="text-xs font-semibold text-gray-700 mb-1">
              {category}
            </div>
          )}
          <h3 className="font-semibold text-lg text-gray-400 line-clamp-1 mb-1">
            {name}
          </h3>
          {/* Brand as a link, styled as in the design */}
          {brand && (
            <div className="mb-1">
              <span className="text-xs text-blue-600 underline hover:text-blue-800 transition-colors cursor-pointer font-medium">
                {brand}
              </span>
            </div>
          )}
          <p className="text-gray-600 text-sm line-clamp-2 min-h-[2.5em] mb-2">
            {description}
          </p>
          <div className="flex items-end justify-between mt-auto pt-2">
            <span className="font-bold text-lg text-gray-900">
              ₹{price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
