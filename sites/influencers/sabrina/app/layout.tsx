import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";
import { LenisProvider } from "@/components/LenisProvider";
import "./globals.css";

// Serif editorial especifico (no Fraunces ni Instrument Serif, regla anti-IA).
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--fuente-serif",
  display: "swap",
});

// Sans humanista (no Inter, regla anti-IA).
const sans = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--fuente-sans",
  display: "swap",
});

const URL_SITIO = "https://sabrinabaez.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: "Sabrina Báez · Creadora de comunidad en Formosa",
    template: "%s · Sabrina Báez",
  },
  description:
    "Contenido, capacitaciones y encuentros para marcas y emprendedoras de Formosa. Te ayudo a mostrar lo que hacés de una forma que se sienta propia.",
  keywords: [
    "creadora de contenido",
    "Formosa",
    "marketing para emprendedoras",
    "produccion de contenido",
    "comunidad",
  ],
  authors: [{ name: "Sabrina Báez" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: URL_SITIO,
    siteName: "Sabrina Báez",
    title: "Sabrina Báez · Creadora de comunidad en Formosa",
    description:
      "Contenido, capacitaciones y encuentros para crecer desde un lugar auténtico.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sabrina Báez · Creadora de comunidad en Formosa",
    description:
      "Contenido, capacitaciones y encuentros para crecer desde un lugar auténtico.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fcf9f8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
