"use client";
import Header from "./Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-[#FDFDFF]">
      <Header />
      <main
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
    </div>
  );
}
