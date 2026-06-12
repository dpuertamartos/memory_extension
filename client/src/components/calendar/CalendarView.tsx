import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  formatScopeLabel,
  getMonthLabels,
  getWeekdayLabels,
  shiftAnchor,
  type CalendarScope,
} from "../../lib/calendarUtils"
import { useCalendarNotes } from "../../hooks/useCalendarNotes"
import { useAppStore } from "../../store/useAppStore"
import TagChip from "../notes/TagChip"
import DayList from "./DayList"
import MonthGrid from "./MonthGrid"
import WeekGrid from "./WeekGrid"
import YearGrid from "./YearGrid"

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

  const handleSelectMonth = (monthDate: Date) => {
    setScope("month")
    setAnchor(monthDate)
    setSelectedDay(monthDate)
  }

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
          {!isLoading && scope === "month" && (
            <MonthGrid
              anchor={anchor}
              selectedDay={selectedDay}
              activityByDay={activityByDay}
              weekdayLabels={weekdayLabels}
              onSelectDay={setSelectedDay}
            />
          )}
          {!isLoading && scope === "week" && (
            <WeekGrid
              anchor={anchor}
              selectedDay={selectedDay}
              activityByDay={activityByDay}
              locale={i18n.language}
              onSelectDay={setSelectedDay}
            />
          )}
          {!isLoading && scope === "year" && (
            <YearGrid
              anchor={anchor}
              monthLabels={monthLabels}
              activityByDay={activityByDay}
              onSelectMonth={handleSelectMonth}
            />
          )}
          {!isLoading && scope === "day" && (
            <DayList notes={selectedDayNotes} locale={i18n.language} onOpenNote={openNote} />
          )}
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
              <DayList notes={selectedDayNotes} locale={i18n.language} onOpenNote={openNote} />
            </div>

            {topTags.length > 0 && (
              <div>
                <h3 className="section-label mb-2">{t("calendar.topTags")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map((tag) => (
                    <TagChip
                      key={tag.name}
                      tag={{ id: tag.name, name: tag.name, color: tag.color }}
                      suffix={` (${tag.count})`}
                    />
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
