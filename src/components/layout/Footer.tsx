"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const persisted = localStorage.getItem("auth-storage");
      if (token) return setIsLoggedIn(true);
      if (persisted) {
        const parsed = JSON.parse(persisted || "null");
        return setIsLoggedIn(Boolean(parsed?.token));
      }
      setIsLoggedIn(false);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);
  return (
    <footer className="bg-[#1C1A1A] text-gray-300">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand + social */}
          <div className="col-span-1">
            <Image src="/logo-1.png" alt="FoodAdda" width={120} height={120} />
            <div className="mt-4">
              <a
                href="#"
                aria-label="Instagram"
                className="inline-flex items-center gap-3 group"
                title="Instagram"
              >
                <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-white/10 transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.056 1.97.24 2.427.403a4.92 4.92 0 0 1 1.77 1.153 4.92 4.92 0 0 1 1.153 1.77c.163.457.347 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.97-.403 2.427a4.92 4.92 0 0 1-1.153 1.77 4.92 4.92 0 0 1-1.77 1.153c-.457.163-1.257.347-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.97-.24-2.427-.403a4.92 4.92 0 0 1-1.77-1.153 4.92 4.92 0 0 1-1.153-1.77c-.163-.457-.347-1.257-.403-2.427C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.17.24-1.97.403-2.427a4.92 4.92 0 0 1 1.153-1.77 4.92 4.92 0 0 1 1.77-1.153c.457-.163 1.257-.347 2.427-.403C8.416 2.175 8.796 2.163 12 2.163Zm0 1.622c-3.155 0-3.527.012-4.772.069-.98.045-1.51.206-1.862.342-.469.182-.803.399-1.154.75-.351.351-.568.685-.75 1.154-.136.352-.297.882-.342 1.862-.057 1.245-.069 1.617-.069 4.772s.012 3.527.069 4.772c.045.98.206 1.51.342 1.862.182.469.399.803.75 1.154.351.351.685.568 1.154.75.352.136.882.297 1.862.342 1.245.057 1.617.069 4.772.069s3.527-.012 4.772-.069c.98-.045 1.51-.206 1.862-.342.469-.182.803-.399 1.154-.75.351-.351.568-.685.75-1.154.136-.352.297-.882.342-1.862.057-1.245.069-1.617.069-4.772s-.012-3.527-.069-4.772c-.045-.98-.206-1.51-.342-1.862a3.3 3.3 0 0 0-.75-1.154 3.3 3.3 0 0 0-1.154-.75c-.352-.136-.882-.297-1.862-.342-1.245-.057-1.617-.069-4.772-.069Zm0 3.513a4.702 4.702 0 1 1 0 9.404 4.702 4.702 0 0 1 0-9.404Zm0 1.622a3.08 3.08 0 1 0 0 6.16 3.08 3.08 0 0 0 0-6.16Zm5.995-2.46a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
                  </svg>
                </span>
                <span className="text-sm text-gray-300 group-hover:text-white transition">
                  Instagram
                </span>
              </a>
            </div>
          </div>

          {/* Column: Food Adda */}
          <div>
            <div className="text-gray-200 text-sm font-semibold mb-3">
              FOOD ADDA
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="hover:text-white" href="#">
                  About us
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/blog">
                  Blogs
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="#">
                  Subscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Services */}
          <div>
            <div className="text-gray-200 text-sm font-semibold mb-3">
              SERVICES
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="hover:text-white"
                  href={isLoggedIn ? "/forms/B2B" : "/#b2b-b2c"}
                >
                  B2B Marketplace
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white"
                  href={isLoggedIn ? "/forms/B2C" : "/#b2b-b2c"}
                >
                  B2C Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Learn more */}
          <div>
            <div className="text-gray-200 text-sm font-semibold mb-3">
              LEARN MORE
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="hover:text-white" href="#">
                  Privacy
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="#">
                  Security
                </Link>
              </li>
              <li>
                <Link className="hover:text-white" href="/terms">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column: Contact */}
          <div>
            <div className="text-gray-200 text-sm font-semibold mb-3">
              CONTACT
            </div>
            <div className="text-sm">
              <div className="mb-2">contactus@foodadda.com</div>
              <div>+91 734 284 212</div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-4 text-[12px] text-gray-400 flex items-center justify-between">
          <div>Copyright</div>
          <div>Food Adda. All rights reserved</div>
        </div>
      </div>
    </footer>
  );
}
