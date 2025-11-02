"use client";
import Image from "next/image";
import { FiSearch } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface ProductSuggestion {
  id: string;
  name: string;
  image_url?: string;
  price?: number;
}
interface KeywordSuggestion {
  id: string;
  name: string;
}

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [kwSuggestions, setKwSuggestions] = useState<KeywordSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query) {
      setSuggestions([]);
      setKwSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const [res, kw] = await Promise.all([
          api.get("/products", { params: { q: query, limit: 5 } }),
          api.get("/keywords/search", { params: { q: query, limit: 5 } }),
        ]);
        const items = (res.data?.data || []) as Array<{
          id: string;
          name: string;
          image_url?: string;
          price?: number;
        }>;
        setSuggestions(
          items.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.name,
            image_url: p.image_url,
            price: p.price,
          }))
        );
        setKwSuggestions((kw.data?.data || []) as KeywordSuggestion[]);
        setOpen(true);
      } catch {
        setSuggestions([]);
        setKwSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/products-list?${params.toString()}`);
  };

  return (
    <section className="relative h-[665px] flex pt-36 bg-black px-6 md:px-8">
      {/* Background Image */}
      <Image
        src="/images/hero-bg.jpg"
        alt="Hero Background"
        fill
        className="object-cover object-center opacity-70"
        priority
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Content */}
      <div className="relative z-10 max-w-3xl px-4 gap-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Your <span className="text-[#F4D300]">one-stop</span> platform for all
          food industry needs.
        </h1>
        <p className="text-[#D0D0D0] mb-14">
          From small businesses to large-scale enterprises, we empower food
          industry professionals & businesses with a network to source, connect,
          and grow.
        </p>
        <div className="relative max-w-2xl">
          <form
            onSubmit={onSubmit}
            className="flex bg-white rounded-full shadow-lg overflow-hidden"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search products"
              className="flex-1 px-6 py-4 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-lg font-medium border-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-4 bg-[#F4D300] text-black font-bold text-lg rounded-r-full hover:bg-yellow-400 transition"
              style={{ minWidth: 120 }}
            >
              <FiSearch size={22} />
              Search
            </button>
          </form>
          {open &&
            (suggestions.length > 0 || kwSuggestions.length > 0 || loading) && (
              <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                {loading && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Searching…
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Products
                    </div>
                    <ul className="max-h-72 overflow-auto">
                      {suggestions.map((s) => (
                        <li key={s.id} className="hover:bg-gray-50">
                          <Link
                            href={`/product/${s.id}`}
                            className="flex items-center gap-3 px-4 py-3"
                            onClick={() => setOpen(false)}
                          >
                            <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  s.image_url || "/images/default-product.jpg"
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {s.name}
                              </div>
                              {s.price !== undefined && (
                                <div className="text-xs text-gray-500">
                                  ₹{s.price}
                                </div>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                      {!loading && suggestions.length === 0 && (
                        <li className="px-4 py-3 text-sm text-gray-500">
                          No products
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Keywords
                    </div>
                    <ul className="max-h-72 overflow-auto">
                      {kwSuggestions.map((k) => (
                        <li key={k.id} className="hover:bg-gray-50">
                          <Link
                            href={`/products-list?keywordIds=${k.id}`}
                            className="flex items-center gap-3 px-4 py-3"
                            onClick={() => setOpen(false)}
                          >
                            <div className="w-10 h-10 rounded bg-yellow-100 text-yellow-800 flex items-center justify-center text-sm font-semibold">
                              #
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {k.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Keyword
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                      {!loading && kwSuggestions.length === 0 && (
                        <li className="px-4 py-3 text-sm text-gray-500">
                          No keywords
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (query) params.set("q", query);
                      router.push(`/products-list?${params.toString()}`);
                    }}
                    className="w-full text-center px-4 py-3 text-sm font-medium text-[#181818] hover:bg-gray-50"
                  >
                    View all results
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
