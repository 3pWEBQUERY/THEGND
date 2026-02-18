"use client";

import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LOCALES = ["de","en","fr","it","es","pt","nl","pl","cs","hu","ro"] as const

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Lese das Locale-Präfix aus dem Pfad und setze die Sprache in i18n
    const match = pathname.match(/^\/(de|en|fr|it|es|pt|nl|pl|cs|hu|ro)(?:\/|$)/)
    const loc = (match?.[1] as (typeof LOCALES)[number] | undefined) ?? "de"
    if (i18n.language !== loc) {
      i18n.changeLanguage(loc)
    }
  }, [pathname])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
