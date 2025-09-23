import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodAdda",
  description: "FoodAdda",
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
