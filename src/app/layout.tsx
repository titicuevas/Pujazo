import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Pujazo — Tu próximo movimiento en fantasy",
  description:
    "Introduce tu equipo, tu saldo, tu mercado y las reglas de tu liga. Pujazo te devuelve un plan claro de fichajes, ventas, pujas y alineación.",
  applicationName: "Pujazo",
  openGraph: {
    title: "Pujazo — Tu próximo movimiento en fantasy",
    description:
      "Asistente independiente de fantasy fútbol: fichajes, pujas, ventas y alineación a partir de tus datos.",
    locale: "es_ES",
    type: "website",
    siteName: "Pujazo",
  },
  twitter: {
    card: "summary",
    title: "Pujazo — Tu próximo movimiento en fantasy",
    description:
      "Plan de fichajes, pujas y alineación sin conectar cuentas ni inventar datos en vivo.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1f17",
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
