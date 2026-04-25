import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "DriveRoutes - Discover the Best Driving Roads",
  description: "A social platform for discovering, rating, and sharing the best driving roads for cars and motorcycles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="bg-slate-950 text-white font-sans m-0 p-0">
        {children}
      </body>
    </html>
  );
}
