import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { ScentSphereProvider } from "@/components/ScentSphereContext";
import { runSyncEngine } from "@/lib/syncEngine";

// Trigger the autonomous sync engine on server startup
runSyncEngine().catch(err => console.error("Sync Engine Failure:", err));

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UCA | Luxury Perfume Encyclopedia",
  description: "Immerse yourself in the art of perfumery. Discover detailed olfactory pyramids, curate your collection, and share reviews in a cinematic scent community.",
  keywords: ["perfume", "fragrance", "cologne", "luxury scent", "perfume database", "notes", "olfactory pyramid"],
  authors: [{ name: "UCA Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <ScentSphereProvider>
          {children}
        </ScentSphereProvider>
      </body>
    </html>
  );
}

