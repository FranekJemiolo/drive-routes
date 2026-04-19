import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="en">
      <body className="bg-gray-900 text-white font-sans">
        {children}
      </body>
    </html>
  );
}
