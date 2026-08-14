import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { AgeGate } from "@/components/age-gate";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { SITE } from "@/lib/constants";
import { THEME_COLOR } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["Escort", "Begleitservice", "Verzeichnis", "verifiziert", "Agentur", "Club"],
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE.name,
    // Die Statusleiste liegt über dem Inhalt — die Seite bringt ihre eigenen
    // Sicherheitsabstände mit (siehe `viewportFit` und die Kopfzeile).
    statusBarStyle: "black-translucent",
  },
  robots: { index: true, follow: true },
  other: { rating: "adult", "RTA-5042-1996-1400-1577-RTA": "RTA-5042-1996-1400-1577-RTA" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <Providers>
          <AgeGate />
          {children}
          <PwaProvider />
        </Providers>
      </body>
    </html>
  );
}
