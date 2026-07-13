/**
 * Phase 6 — Infrastructure i18n (FR/EN).
 *
 * Détection langue : localStorage > navigateur > fallback FR.
 * Namespaces : common, finance, admin, site.
 * Les libellés métier passent par ces clés (voir StatutBadge, etc.).
 */
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import frCommon from "./locales/fr/common.json";
import frFinance from "./locales/fr/finance.json";
import frAdmin from "./locales/fr/admin.json";
import frSite from "./locales/fr/site.json";
import enCommon from "./locales/en/common.json";
import enFinance from "./locales/en/finance.json";
import enAdmin from "./locales/en/admin.json";
import enSite from "./locales/en/site.json";

export const SUPPORTED_LANGS = ["fr", "en"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const LANGUAGE_STORAGE_KEY = "lovable_language";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: frCommon, finance: frFinance, admin: frAdmin, site: frSite },
      en: { common: enCommon, finance: enFinance, admin: enAdmin, site: enSite },
    },
    fallbackLng: "fr",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    defaultNS: "common",
    ns: ["common", "finance", "admin", "site"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export default i18n;
