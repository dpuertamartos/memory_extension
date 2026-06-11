import { CalendarBlankIcon, GearIcon, ListIcon, NotePencilIcon, TagIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import type { MobilePane } from "../../store/useAppStore"
import { useAppStore } from "../../store/useAppStore"

const MobileNav = () => {
  const { t } = useTranslation()
  const { mobilePane, selectedTagId, selectedNoteId, setMobilePane } = useAppStore()

  const items: { pane: MobilePane; label: string; icon: typeof ListIcon }[] = [
    { pane: "tags", label: t("nav.tags"), icon: TagIcon },
    { pane: "list", label: t("nav.notes"), icon: ListIcon },
    { pane: "calendar", label: t("nav.calendar"), icon: CalendarBlankIcon },
    { pane: "editor", label: t("nav.editor"), icon: NotePencilIcon },
    { pane: "settings", label: t("nav.settings"), icon: GearIcon },
  ]

  return (
    <nav className="safe-area-bottom flex border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden">
      {items.map(({ pane, label, icon: Icon }) => {
        const isActive = mobilePane === pane
        const showFilterDot = pane === "list" && selectedTagId !== null
        const showEditorDot = pane === "editor" && selectedNoteId !== null

        return (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span className="relative">
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              {(showFilterDot || showEditorDot) && (
                <span
                  className={`absolute -right-1 -top-0.5 h-2 w-2 rounded-full ${
                    showFilterDot ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                  aria-hidden
                />
              )}
            </span>
            {label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default MobileNav
