import { getWeekDays, isSameDay, toDateKey } from "../../lib/calendarUtils"
import type { DayActivity } from "../../hooks/useCalendarNotes"
import ActivityDots from "./ActivityDots"

type WeekGridProps = {
  anchor: Date
  selectedDay: Date | null
  activityByDay: Map<string, DayActivity>
  locale: string
  onSelectDay: (day: Date) => void
}

const WeekGrid = ({ anchor, selectedDay, activityByDay, locale, onSelectDay }: WeekGridProps) => {
  const days = getWeekDays(anchor)

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const selected = selectedDay && isSameDay(day, selectedDay)
        const isToday = isSameDay(day, new Date())

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelectDay(day)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selected
                ? "border-accent-muted bg-accent-soft dark:border-accent/50 dark:bg-accent/15"
                : "border-border hover:bg-accent-soft/40 dark:border-charcoal-border dark:hover:bg-charcoal"
            } ${isToday ? "ring-1 ring-accent-muted dark:ring-accent/50" : ""}`}
          >
            <p className="text-xs text-ink-subtle">
              {day.toLocaleDateString(locale, { weekday: "short" })}
            </p>
            <p className="font-display text-lg font-semibold">{day.getDate()}</p>
            <ActivityDots activity={activityByDay.get(toDateKey(day))} />
          </button>
        )
      })}
    </div>
  )
}

export default WeekGrid
