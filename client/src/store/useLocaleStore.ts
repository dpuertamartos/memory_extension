import { create } from "zustand"
import i18n, { persistLocale, type AppLocale } from "../i18n"

interface LocaleState {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: i18n.language as AppLocale,
  setLocale: (locale) => {
    void i18n.changeLanguage(locale)
    persistLocale(locale)
    set({ locale })
  },
}))
