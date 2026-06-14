import { CaretRightIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useDivisionAncestors, useFocusDivision } from "../../hooks/useDivisions"
import { useAppStore } from "../../store/useAppStore"

const DivisionBreadcrumb = () => {
  const { t } = useTranslation()
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const { focusDivision } = useFocusDivision()
  const ancestors = useDivisionAncestors(focusDivisionId)

  if (ancestors.length <= 1) return null

  return (
    <nav
      aria-label={t("divisions.breadcrumb")}
      className="mb-2 flex flex-wrap items-center gap-1 text-xs text-ink-subtle"
    >
      {ancestors.map((division, index) => (
        <span key={division.id} className="flex min-w-0 items-center gap-1">
          {index > 0 && <CaretRightIcon size={10} className="shrink-0" aria-hidden />}
          <button
            type="button"
            onClick={() => focusDivision(division.id)}
            className={`truncate hover:text-accent dark:hover:text-accent-muted ${
              division.id === focusDivisionId ? "font-medium text-ink-muted" : ""
            }`}
          >
            {division.name}
          </button>
        </span>
      ))}
    </nav>
  )
}

export default DivisionBreadcrumb
