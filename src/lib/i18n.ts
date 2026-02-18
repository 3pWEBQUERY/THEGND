"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Statische Ressourcen; können später durch Lazy-Loading/Backend ersetzt werden
import deCommon from "@/locales/de/common.json";
import enCommon from "@/locales/en/common.json";
import frCommon from "@/locales/fr/common.json";
import itCommon from "@/locales/it/common.json";
import esCommon from "@/locales/es/common.json";
import ptCommon from "@/locales/pt/common.json";
import nlCommon from "@/locales/nl/common.json";
import plCommon from "@/locales/pl/common.json";
import csCommon from "@/locales/cs/common.json";
import huCommon from "@/locales/hu/common.json";
import roCommon from "@/locales/ro/common.json";

const resources = {
  de: { common: deCommon },
  en: { common: enCommon },
  fr: { common: frCommon },
  it: { common: itCommon },
  es: { common: esCommon },
  pt: { common: ptCommon },
  nl: { common: nlCommon },
  pl: { common: plCommon },
  cs: { common: csCommon },
  hu: { common: huCommon },
  ro: { common: roCommon },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "de",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    defaultNS: "common",
    ns: ["common"],
    returnEmptyString: false,
  });
}

export default i18n;
