import { useTranslation } from "react-i18next"
import type { DayActivity } from "../../hooks/useCalendarNotes"

type YearGridProps = {
  anchor: Date
  monthLabels: string[]
  activityByDay: Map<string, DayActivity>
  onSelectMonth: (monthDate: Date) => void
}

const YearGrid = ({ anchor, monthLabels, activityByDay, onSelectMonth }: YearGridProps) => {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {monthLabels.map((label, index) => {
        const monthDate = new Date(anchor.getFullYear(), index, 1)
        const monthActivity = [...activityByDay.entries()].filter(([key]) => {
          const [year, month] = key.split("-").map(Number)
          return year === anchor.getFullYear() && month === index + 1
        })
        const noteCount = monthActivity.reduce((sum, [, activity]) => sum + activity.notes.length, 0)

        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelectMonth(monthDate)}
            className="surface-inset p-3 text-left transition-colors hover:bg-accent-soft/40 dark:hover:bg-charcoal"
          >
            <p className="font-medium">{label}</p>
            <p className="mt-1 text-xs text-ink-subtle">
              {noteCount === 0
                ? t("calendar.noActivity")
                : t("calendar.noteActivity", { count: noteCount })}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export default YearGrid
