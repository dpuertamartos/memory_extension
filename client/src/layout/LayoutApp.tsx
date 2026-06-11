import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import AppRouter from "../AppRouter"
import MobileNav from "../components/notes/MobileNav"
import LogoApp from "./LogoApp"
import { useThemeStore } from "../store/useThemeStore"

const LayoutApp = () => {
  const { t } = useTranslation()
  const { isDarkMode, toggleDarkMode } = useThemeStore()

  return (
    <div className={`${isDarkMode ? "dark" : ""} flex h-screen flex-col`}>
      <div className="flex min-h-0 flex-1 flex-col bg-white text-gray-600 dark:bg-gray-900 dark:text-white">
        <header className="safe-area-top flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-3">
            <LogoApp compact />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="hidden rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:inline"
            >
              {t("common.settings")}
            </Link>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={t("nav.toggleTheme")}
            >
              {isDarkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">
          <AppRouter />
        </main>

        <MobileNav />
      </div>
    </div>
  )
}

export default LayoutApp
