import { getMonthGridDays, isSameDay, toDateKey } from "../../lib/calendarUtils"
import type { DayActivity } from "../../hooks/useCalendarNotes"
import ActivityDots from "./ActivityDots"

type MonthGridProps = {
  anchor: Date
  selectedDay: Date | null
  activityByDay: Map<string, DayActivity>
  weekdayLabels: string[]
  onSelectDay: (day: Date) => void
}

const MonthGrid = ({
  anchor,
  selectedDay,
  activityByDay,
  weekdayLabels,
  onSelectDay,
}: MonthGridProps) => {
  const days = getMonthGridDays(anchor)
  const month = anchor.getMonth()

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekdayLabels.map((label) => (
        <div key={label} className="section-label py-1 text-center">
          {label}
        </div>
      ))}
      {days.map((day) => {
        const inMonth = day.getMonth() === month
        const selected = selectedDay && isSameDay(day, selectedDay)
        const isToday = isSameDay(day, new Date())

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelectDay(day)}
            className={`flex min-h-[3.25rem] flex-col items-center rounded-lg p-1 text-sm transition-colors ${
              selected
                ? "bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-muted"
                : inMonth
                  ? "hover:bg-accent-soft/50 dark:hover:bg-charcoal"
                  : "text-ink-subtle dark:text-charcoal-subtle"
            } ${isToday ? "ring-1 ring-accent-muted dark:ring-accent/50" : ""}`}
          >
            <span>{day.getDate()}</span>
            <ActivityDots activity={activityByDay.get(toDateKey(day))} />
          </button>
        )
      })}
    </div>
  )
}

export default MonthGrid
