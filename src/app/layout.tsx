import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodAdda",
  description: "FoodAdda",
  icons: {
    icon: "/logo-1.png",
    shortcut: "/logo-1.png",
    apple: "/logo-1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#FDFDFF]">{children}</body>
    </html>
  );
}
