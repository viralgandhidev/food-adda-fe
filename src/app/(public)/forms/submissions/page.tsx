"use client";
// @ts-nocheck
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";

type Submission = {
  id: number;
  form_type: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  payload: Record<string, unknown>;
  created_at: string;
  files?: Array<{
    id: number;
    field_name: string;
    file_path: string;
    original_name: string;
    mime_type: string;
    size: number;
  }>;
};

function SubmissionsContent() {
  const sp = useSearchParams();
  const type = (sp.get("type") as string) || "B2B";
  const [items, setItems] = useState<Submission[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    async (p: number) => {
      setLoading(true);
      const res = await api.get("/forms/list", {
        params: { form_type: type, page: p, limit: 12 },
      });
      setItems(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setLoading(false);
    },
    [type]
  );

  useEffect(() => {
    fetchData(1);
  }, [type, fetchData]);

  const Card = ({ s }: { s: Submission }) => {
    const payload =
      typeof s.payload === "string" ? JSON.parse(s.payload) : s.payload;
    const images = (s.files || []).filter((f) =>
      (f.mime_type || "").startsWith("image")
    );
    const firstImage = images[0];
    const title =
      s.contact_name || payload?.company_name || payload?.name || "Untitled";

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");
    const getFullFileUrl = (p?: string) => {
      if (!p) return undefined;
      if (p.startsWith("http")) return p;
      if (p.startsWith("/uploads/")) return `${BACKEND_BASE_URL}${p}`;
      if (p.startsWith("uploads")) return `${BACKEND_BASE_URL}/${p}`;
      return `${BACKEND_BASE_URL}/${p.replace(/^\//, "")}`;
    };

    return (
      <div className="group rounded-2xl border border-yellow-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {firstImage ? (
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              src={
                getFullFileUrl(firstImage.file_path) ||
                "/images/default-product.jpg"
              }
              alt={firstImage.original_name || title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <span className="absolute left-3 top-3 bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-semibold rounded-full border border-yellow-200 text-[#111827]">
              {s.form_type}
            </span>
          </div>
        ) : null}

        <div className="p-5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold text-[#181818] line-clamp-1">
              {title}
            </div>
            <div className="text-[11px] text-gray-500 whitespace-nowrap">
              {new Date(s.created_at).toLocaleString()}
            </div>
          </div>

          <div className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
            {(s.contact_email || payload?.email) && (
              <span className="truncate">
                {s.contact_email || payload?.email}
              </span>
            )}
            {(s.contact_phone || payload?.phone) && (
              <span className="truncate text-right">
                {s.contact_phone || payload?.phone}
              </span>
            )}
          </div>

          {images.length > 1 ? (
            <div className="mt-2 flex -space-x-2">
              {images.slice(0, 5).map((f) => (
                <Image
                  key={f.id}
                  src={
                    getFullFileUrl(f.file_path) || "/images/default-product.jpg"
                  }
                  alt={f.original_name || "image"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-md border border-white shadow object-cover"
                />
              ))}
              {images.length > 5 && (
                <span className="h-8 w-8 rounded-md border text-[10px] flex items-center justify-center bg-white text-gray-600">
                  +{images.length - 5}
                </span>
              )}
            </div>
          ) : null}

          {!firstImage && s.files && s.files.length ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {s.files.slice(0, 3).map((f) => (
                <a
                  key={f.id}
                  href={`/${f.file_path}`}
                  className="text-xs underline text-[#111827]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {f.original_name || f.field_name}
                </a>
              ))}
              {s.files.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{s.files.length - 3} more
                </span>
              )}
            </div>
          ) : null}

          <div className="text-xs text-gray-500 mt-1 line-clamp-3">
            {payload?.description ||
              payload?.product_description ||
              payload?.requirement ||
              "No additional details"}
          </div>
        </div>
      </div>
    );
  };

  const gridCols = type === "RECRUITMENT" ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <div className="min-h-screen bg-white px-6 md:px-12 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#181818]">
            {type} Submissions
          </h1>
          <p className="text-sm text-gray-500">
            Latest first · Page {page} of {totalPages}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 bg-white rounded-2xl border border-yellow-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h2 className="text-xl font-semibold text-[#181818]">
                No submissions yet
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Once users submit the {type} form, entries will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 ${gridCols} gap-5`}>
                {items.map((s) => (
                  <Card key={s.id} s={s} />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm text-[#111827] shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:bg-white"
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchData(p);
                  }}
                >
                  Prev
                </button>
                <span className="text-sm font-medium text-[#111827]">
                  {page} / {totalPages}
                </span>
                <button
                  className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm text-[#111827] shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:bg-white"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    fetchData(p);
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SubmissionsContent />
    </Suspense>
  );
}
