import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DLSAU USC-CSC",
  description:
    "The official Website for the De La Salle Araneta University Student Council (USC) and College Student Councils (CSC).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-zinc-50">
        <Navbar />
        {/* Wrapping children in a flex-1 main block ensures it pushes the footer down */}
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}