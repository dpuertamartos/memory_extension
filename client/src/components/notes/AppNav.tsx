import {
  BrainIcon,
  CalendarBlankIcon,
  ListIcon,
  TagIcon,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import type { NavPane } from "../../store/useAppStore"
import { useAppStore } from "../../store/useAppStore"

const AppNav = () => {
  const { t } = useTranslation()
  const { activePane, selectedTagId, selectedNoteId, subBrainsEnabled, setActivePane } =
    useAppStore()

  const items: { pane: NavPane; label: string; icon: typeof ListIcon }[] = [
    { pane: "list", label: t("nav.notes"), icon: ListIcon },
    { pane: "calendar", label: t("nav.calendar"), icon: CalendarBlankIcon },
    ...(subBrainsEnabled
      ? [{ pane: "divisions" as NavPane, label: t("nav.subBrains"), icon: BrainIcon }]
      : []),
    { pane: "tags", label: t("nav.tags"), icon: TagIcon },
  ]

  return (
    <nav className="app-top-nav" aria-label={t("nav.mobileNav")}>
      {items.map(({ pane, label, icon: Icon }) => {
        const isActive = activePane === pane
        const showFilterDot = pane === "list" && selectedTagId !== null
        const showEditorDot = pane === "list" && selectedNoteId !== null

        return (
          <button
            key={pane}
            type="button"
            onClick={() => setActivePane(pane)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={`app-nav-item ${isActive ? "app-nav-item-active" : ""}`}
          >
            <span className="relative shrink-0">
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              {(showFilterDot || showEditorDot) && (
                <span
                  className={`absolute -top-0.5 -right-1 h-2 w-2 rounded-full ${
                    showFilterDot ? "bg-accent" : "bg-synapse"
                  }`}
                  aria-hidden
                />
              )}
            </span>
            <span className="app-nav-label">{label}</span>
            {isActive && <span className="app-nav-indicator" aria-hidden />}
          </button>
        )
      })}
    </nav>
  )
}

export default AppNav
