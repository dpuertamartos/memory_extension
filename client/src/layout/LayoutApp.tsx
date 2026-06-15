import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import AppRouter from "../AppRouter"
import LocalTrustBadge from "../components/brand/LocalTrustBadge"
import AppNav from "../components/notes/AppNav"
import LogoApp from "./LogoApp"
import { useThemeStore } from "../store/useThemeStore"

const LayoutApp = () => {
  const { t } = useTranslation()
  const { isDarkMode, toggleDarkMode } = useThemeStore()

  return (
    <div className={`${isDarkMode ? "dark" : ""} flex h-dvh flex-col`}>
      <div className="surface-app flex min-h-0 flex-1 flex-col">
        <header className="safe-area-top surface-header flex shrink-0 items-center justify-between px-3 py-2.5 md:px-4 md:py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <LogoApp compact />
          </Link>

          <div className="flex items-center gap-2">
            <LocalTrustBadge />
            <Link
              to="/settings"
              className="rounded-md px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-paper hover:text-ink dark:text-charcoal-muted dark:hover:bg-charcoal-elevated dark:hover:text-stone-200"
            >
              {t("common.settings")}
            </Link>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="icon-btn"
              aria-label={t("nav.toggleTheme")}
            >
              {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
          </div>
        </header>

        <AppNav />

        <main className="min-h-0 flex-1 overflow-hidden">
          <AppRouter />
        </main>
      </div>
    </div>
  )
}

export default LayoutApp
