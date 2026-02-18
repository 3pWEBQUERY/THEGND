/**
 * next-i18next configuration for App Router
 */
const locales = [
  "de",
  "en",
  "fr",
  "it",
  "es",
  "pt",
  "nl",
  "pl",
  "cs",
  "hu",
  "ro",
];

const config = {
  i18n: {
    defaultLocale: "de",
    locales,
    // App Router unterstützt keine automatische Locale-Erkennung per Header mehr
    localeDetection: false,
  },
  reloadOnPrerender: process.env.NODE_ENV === "development",
};

export default config;
