import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "ShopIQ",
  description: "Predictive e-commerce and warehouse management dashboard",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
