import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { THEME_COLOR } from "@/lib/brand";

/**
 * Web-App-Manifest.
 *
 * Macht die Seite installierbar: eigenes Symbol auf dem Startbildschirm,
 * Start ohne Browserleiste, Kurzbefehle beim langen Drücken. Die Farben
 * kommen aus denselben Marken-Tokens wie der Rest der Oberfläche.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: "de-CH",
    dir: "ltr",
    categories: ["lifestyle", "social"],

    // Der Startpunkt trägt eine Kennzeichnung, damit sich Aufrufe aus der
    // installierten App später von gewöhnlichen Besuchen trennen lassen.
    start_url: "/?quelle=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],

    // Der Startbildschirm der App ist dunkel — so blendet der Start nicht.
    background_color: THEME_COLOR.dark,
    theme_color: THEME_COLOR.dark,

    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],

    screenshots: [
      {
        src: "/icons/screenshot-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
    ],

    shortcuts: [
      {
        name: "Escorts entdecken",
        short_name: "Escorts",
        url: "/escorts",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Agenturen & Clubs",
        short_name: "Häuser",
        url: "/agenturen",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Feed & Stories",
        short_name: "Feed",
        url: "/feed",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Nachrichten",
        short_name: "Nachrichten",
        url: "/dashboard/nachrichten",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],

    prefer_related_applications: false,
  };
}
