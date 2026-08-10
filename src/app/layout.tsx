import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
import { PwaClient } from "@/components/pwa/PwaClient";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  fallback: ["Avenir Next", "Segoe UI", "sans-serif"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Avenir Next", "Segoe UI", "sans-serif"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pujazo — Tu próximo movimiento en fantasy",
    template: "%s · Pujazo",
  },
  description:
    "Introduce tu equipo, tu saldo, tu mercado y las reglas de tu liga. Pujazo te devuelve un plan claro de fichajes, ventas, pujas y alineación.",
  applicationName: "Pujazo",
  appleWebApp: {
    capable: true,
    title: "Pujazo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Pujazo — Tu próximo movimiento en fantasy",
    description:
      "Asistente independiente de fantasy fútbol: fichajes, pujas, ventas y alineación a partir de tus datos.",
    locale: "es_ES",
    type: "website",
    siteName: "Pujazo",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pujazo — Tu próximo movimiento en fantasy",
    description:
      "Plan de fichajes, pujas y alineación sin conectar cuentas ni inventar datos en vivo.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1f17",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${syne.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <a href="#contenido-principal" className="skip-link">
          Saltar al contenido
        </a>
        {children}
        <PwaClient />
      </body>
    </html>
  );
}
