import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/auth-provider";
import I18nProvider from "@/components/providers/i18n-provider";
import MobileNavbar from "@/components/MobileNavbar";
import PresenceHeartbeat from "@/components/providers/PresenceHeartbeat";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";
import { getPublicSettings } from "@/lib/settings";
import { getAvailableLocales } from "@/lib/locales";
import PublicSettingsProvider from "@/components/providers/public-settings-provider";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings()
  const locales = await getAvailableLocales()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  const metadataBase = siteUrl ? new URL(siteUrl) : undefined
  const defaultTitle = s.tagline
    ? `${s.name}${s.titleSeparator || ' | '}${s.tagline}`
    : s.name
  const title: Metadata['title'] = s.seo.titleTemplate
    ? { default: defaultTitle, template: s.seo.titleTemplate }
    : defaultTitle
  const description = s.seo.metaDescription || "Das Innovative Escort Portal in der digitalen Welt"
  const icons = s.faviconUrl
    ? { icon: [{ url: s.faviconUrl }] }
    : {
        icon: [
          { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
          { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        other: [
          { rel: "android-chrome", url: "/android-chrome-192x192.png" },
          { rel: "android-chrome", url: "/android-chrome-512x512.png" },
        ],
      }

  return {
    metadataBase,
    title,
    description,
    manifest: "/manifest.webmanifest",
    icons,
    alternates: siteUrl
      ? {
          canonical: `/${s.primaryLocale || 'de'}`,
          languages: Object.fromEntries(locales.map((code) => [code, `/${code}`])),
        }
      : undefined,
    openGraph: s.seo.ogImageUrl
      ? {
          title: s.name,
          description,
          images: [s.seo.ogImageUrl],
        }
      : undefined,
    robots: {
      index: s.seo.robotsIndex,
      follow: s.seo.robotsIndex,
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSettings()
  return (
    <html lang={settings.primaryLocale || "de"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData path="/" />
        <AuthProvider>
          <I18nProvider>
            <PublicSettingsProvider initial={settings}>
              <ToastProvider>
                <PresenceHeartbeat />
                <div className="pb-24 md:pb-0">{children}</div>
                <MobileNavbar />
              </ToastProvider>
            </PublicSettingsProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
