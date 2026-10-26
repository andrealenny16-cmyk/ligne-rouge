import type { Metadata, Viewport } from "next";
import { Anton, Inter, Manrope } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "DÉCIBEL Performance — Échappements titane voiture & moto", template: "%s · DÉCIBEL Performance" },
  description:
    "Lignes complètes, silencieux et embouts en titane, inox et carbone. Homologués route ou 100 % circuit. Le son. La puissance.",
};

export const viewport: Viewport = { themeColor: "#0A0A0B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-night">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
