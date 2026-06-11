import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import es from "./locales/es.json"

export const SUPPORTED_LOCALES = ["en", "es"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
}

const STORAGE_KEY = "app-locale"

export function getStoredLocale(): AppLocale | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as AppLocale)) {
    return stored as AppLocale
  }
  return null
}

export function resolveInitialLocale(): AppLocale {
  const stored = getStoredLocale()
  if (stored) return stored

  const browser = navigator.language.split("-")[0]
  if (SUPPORTED_LOCALES.includes(browser as AppLocale)) {
    return browser as AppLocale
  }
  return "en"
}

export function persistLocale(locale: AppLocale) {
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: resolveInitialLocale(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

export default i18n
