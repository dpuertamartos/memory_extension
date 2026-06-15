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
  const { setSelectedNoteId, setActivePane } = useAppStore()

  const scopes: { id: CalendarScope; label: string }[] = [
    { id: "day", label: t("calendar.day") },
    { id: "week", label: t("calendar.week") },
    { id: "month", label: t("calendar.month") },
    { id: "year", label: t("calendar.year") },
  ]

  const weekdayLabels = useMemo(() => getWeekdayLabels(i18n.language), [i18n.language])
  const monthLabels = useMemo(() => getMonthLabels(i18n.language), [i18n.language])

  const openNote = (noteId: string) => {
    setActivePane("list")
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

  const { isLoading, activityByDay, selectedDayNotes, scopeTopTags, scopeTopKeywords } =
    useCalendarNotes(scope, anchor, selectedDay)

  const periodLabel = formatScopeLabel(scope, anchor, i18n.language)

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
      <div className="surface-header flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
        <div className="segmented-control w-full shrink-0 sm:w-auto">
          {scopes.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className={`segmented-item !px-2 !py-1.5 text-xs sm:!px-3 sm:text-sm ${
                scope === id ? "segmented-item-active" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-2">
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
            className="min-w-0 flex-1 truncate px-1 text-center font-display text-xs font-medium sm:min-w-[8rem] sm:flex-none sm:text-sm md:min-w-[10rem]"
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:gap-4 lg:p-4">
        <div className="flex min-h-0 flex-[2] flex-col overflow-hidden p-3 sm:p-4 lg:flex-1 lg:p-0">
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DayList notes={selectedDayNotes} locale={i18n.language} onOpenNote={openNote} />
            </div>
          )}
        </div>

        {scope !== "day" && (
          <aside className="flex min-h-0 max-h-[40vh] flex-col overflow-hidden border-t border-border p-3 dark:border-charcoal-border sm:max-h-none sm:flex-1 sm:p-4 lg:w-72 lg:max-h-none lg:shrink-0 lg:border-t-0 lg:p-0">
            {(scopeTopTags.length > 0 || scopeTopKeywords.length > 0) && (
              <div className="mb-4 shrink-0 space-y-4">
                {scopeTopTags.length > 0 && (
                  <div>
                    <h3 className="section-label mb-2">
                      {t("calendar.periodTopTags", { period: periodLabel })}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {scopeTopTags.map((tag) => (
                        <TagChip
                          key={tag.name}
                          tag={{ id: tag.name, name: tag.name, color: tag.color }}
                          suffix={` (${tag.count})`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {scopeTopKeywords.length > 0 && (
                  <div>
                    <h3 className="section-label mb-2">
                      {t("calendar.periodTopKeywords", { period: periodLabel })}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {scopeTopKeywords.map(({ word, count }) => (
                        <span key={word} className="chip-muted">
                          {word} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <h3 className="section-label mb-2 shrink-0">
                {selectedDay
                  ? selectedDay.toLocaleDateString(i18n.language, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : t("calendar.selectedPeriod")}
              </h3>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <DayList notes={selectedDayNotes} locale={i18n.language} onOpenNote={openNote} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default CalendarView
