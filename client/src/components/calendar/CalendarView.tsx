import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  formatScopeLabel,
  getMonthGridDays,
  getMonthLabels,
  getWeekDays,
  getWeekdayLabels,
  isSameDay,
  shiftAnchor,
  toDateKey,
  type CalendarScope,
} from "../../lib/calendarUtils"
import { formatRelativeTime } from "../../lib/formatRelativeTime"
import { useCalendarNotes } from "../../hooks/useCalendarNotes"
import { useAppStore } from "../../store/useAppStore"

const CalendarView = () => {
  const { t, i18n } = useTranslation()
  const { setSelectedNoteId, setMainView } = useAppStore()

  const scopes: { id: CalendarScope; label: string }[] = [
    { id: "day", label: t("calendar.day") },
    { id: "week", label: t("calendar.week") },
    { id: "month", label: t("calendar.month") },
    { id: "year", label: t("calendar.year") },
  ]

  const weekdayLabels = useMemo(() => getWeekdayLabels(i18n.language), [i18n.language])
  const monthLabels = useMemo(() => getMonthLabels(i18n.language), [i18n.language])
  const untitled = t("common.untitled")

  const openNote = (noteId: string) => {
    setMainView("notes")
    setSelectedNoteId(noteId)
  }
  const [scope, setScope] = useState<CalendarScope>("month")
  const [anchor, setAnchor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date())

  useEffect(() => {
    if (scope === "day") {
      setSelectedDay(anchor)
    }
  }, [scope, anchor])

  const { isLoading, activityByDay, selectedDayNotes, topTags, topKeywords } = useCalendarNotes(
    scope,
    anchor,
    selectedDay,
  )

  const handlePrev = () => setAnchor((current) => shiftAnchor(scope, current, -1))
  const handleNext = () => setAnchor((current) => shiftAnchor(scope, current, 1))
  const handleToday = () => {
    const today = new Date()
    setAnchor(today)
    setSelectedDay(today)
  }

  const renderActivityDots = (day: Date) => {
    const activity = activityByDay.get(toDateKey(day))
    if (!activity) return null

    return (
      <div className="mt-0.5 flex justify-center gap-0.5">
        {activity.created > 0 && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-pulse-create"
            title={t("calendar.activityCreated")}
          />
        )}
        {activity.updated > 0 && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-pulse-update"
            title={t("calendar.activityUpdated")}
          />
        )}
      </div>
    )
  }

  const renderMonthGrid = () => {
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
              onClick={() => setSelectedDay(day)}
              className={`flex min-h-[3.25rem] flex-col items-center rounded-lg p-1 text-sm transition-colors ${
                selected
                  ? "bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-muted"
                  : inMonth
                    ? "hover:bg-accent-soft/50 dark:hover:bg-charcoal"
                    : "text-ink-subtle dark:text-charcoal-subtle"
              } ${isToday ? "ring-1 ring-accent-muted dark:ring-accent/50" : ""}`}
            >
              <span>{day.getDate()}</span>
              {renderActivityDots(day)}
            </button>
          )
        })}
      </div>
    )
  }

  const renderWeekGrid = () => {
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
              onClick={() => setSelectedDay(day)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? "border-accent-muted bg-accent-soft dark:border-accent/50 dark:bg-accent/15"
                  : "border-border hover:bg-accent-soft/40 dark:border-charcoal-border dark:hover:bg-charcoal"
              } ${isToday ? "ring-1 ring-accent-muted dark:ring-accent/50" : ""}`}
            >
              <p className="text-xs text-ink-subtle">
                {day.toLocaleDateString(i18n.language, { weekday: "short" })}
              </p>
              <p className="font-display text-lg font-semibold">{day.getDate()}</p>
              {renderActivityDots(day)}
            </button>
          )
        })}
      </div>
    )
  }

  const renderYearGrid = () => (
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
            onClick={() => {
              setScope("month")
              setAnchor(monthDate)
              setSelectedDay(monthDate)
            }}
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

  const renderDayList = () => (
    <div className="space-y-2">
      {selectedDayNotes.length === 0 && (
        <p className="text-sm text-ink-subtle">{t("calendar.noNoteActivity")}</p>
      )}
      {selectedDayNotes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => openNote(note.id)}
          className="surface-inset w-full p-3 text-left transition-colors hover:bg-accent-soft/40 dark:hover:bg-charcoal"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{note.title || untitled}</p>
            <span className="shrink-0 text-xs text-ink-subtle">
              {formatRelativeTime(note.updatedAt, i18n.language)}
            </span>
          </div>
          {note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full px-2 py-0.5 text-[10px] text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="surface-header flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-1">
          {scopes.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                scope === id
                  ? "bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-muted"
                  : "text-ink-muted hover:bg-paper dark:text-charcoal-muted dark:hover:bg-charcoal"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="icon-btn !p-1.5"
            aria-label={t("calendar.previousPeriod")}
          >
            <CaretLeftIcon size={18} />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="min-w-[10rem] font-display text-sm font-medium"
          >
            {formatScopeLabel(scope, anchor, i18n.language)}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="icon-btn !p-1.5"
            aria-label={t("calendar.nextPeriod")}
          >
            <CaretRightIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          {isLoading && <p className="text-sm text-ink-subtle">{t("calendar.loading")}</p>}
          {!isLoading && scope === "month" && renderMonthGrid()}
          {!isLoading && scope === "week" && renderWeekGrid()}
          {!isLoading && scope === "year" && renderYearGrid()}
          {!isLoading && scope === "day" && renderDayList()}
        </div>

        {scope !== "day" && (
          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            <div>
              <h3 className="section-label mb-2">
                {selectedDay
                  ? selectedDay.toLocaleDateString(i18n.language, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : t("calendar.selectedPeriod")}
              </h3>
              {renderDayList()}
            </div>

            {topTags.length > 0 && (
              <div>
                <h3 className="section-label mb-2">{t("calendar.topTags")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map((tag) => (
                    <span
                      key={tag.name}
                      className="rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      #{tag.name} ({tag.count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {topKeywords.length > 0 && (
              <div>
                <h3 className="section-label mb-2">{t("calendar.topKeywords")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {topKeywords.map(({ word, count }) => (
                    <span key={word} className="chip-muted">
                      {word} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

export default CalendarView
