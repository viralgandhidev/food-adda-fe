"use client";
import { useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  headerBgColor?: string;
  isSticky?: boolean;
}

export default function MainLayout({
  children,
  headerBgColor,
  isSticky = false,
}: MainLayoutProps) {
  const mainRef = useRef<HTMLElement | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF]">
      <Header bgColor={headerBgColor} isSticky={isSticky} />
      <main
        ref={mainRef}
        id={isSticky ? "sticky-main-content" : undefined}
        className="flex-1 w-full overflow-y-auto"
        onScroll={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (el.scrollTop === 0) {
            const ev = new CustomEvent("ptr");
            window.dispatchEvent(ev);
          }
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
