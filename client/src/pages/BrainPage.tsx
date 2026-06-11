import { useTranslation } from "react-i18next"
import CalendarView from "../components/calendar/CalendarView"
import NoteEditor from "../components/notes/NoteEditor"
import NoteList from "../components/notes/NoteList"
import Omnibox from "../components/notes/Omnibox"
import TagSidebar from "../components/notes/TagSidebar"
import { useAppStore } from "../store/useAppStore"

const BrainPage = () => {
  const { t } = useTranslation()
  const { mobilePane, mainView, setMainView } = useAppStore()
  const showCalendar = mainView === "calendar" || mobilePane === "calendar"

  return (
    <div className="flex h-full flex-col">
      <div className="surface-header px-3 py-2.5 md:px-4 md:py-3">
        <div className="segmented-control mb-2.5 md:mb-3">
          <button
            type="button"
            onClick={() => setMainView("notes")}
            className={`segmented-item ${!showCalendar ? "segmented-item-active" : ""}`}
          >
            {t("nav.notes")}
          </button>
          <button
            type="button"
            onClick={() => setMainView("calendar")}
            className={`segmented-item ${showCalendar ? "segmented-item-active" : ""}`}
          >
            {t("nav.calendar")}
          </button>
        </div>
        {!showCalendar && <Omnibox />}
      </div>

      {showCalendar ? (
        <CalendarView />
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside
            className={`surface-panel w-full shrink-0 border-r border-border transition-opacity duration-200 dark:border-charcoal-border md:block md:w-52 lg:w-60 ${
              mobilePane === "tags" ? "block opacity-100" : "hidden opacity-0 md:opacity-100"
            }`}
          >
            <TagSidebar />
          </aside>

          <section
            className={`surface-panel w-full shrink-0 border-r border-border transition-opacity duration-200 dark:border-charcoal-border md:block md:w-72 lg:w-80 ${
              mobilePane === "list" ? "block opacity-100" : "hidden opacity-0 md:block md:opacity-100"
            }`}
          >
            <NoteList />
          </section>

          <section
            className={`surface-app min-w-0 flex-1 transition-opacity duration-200 ${
              mobilePane === "editor" ? "block opacity-100" : "hidden opacity-0 md:block md:opacity-100"
            }`}
          >
            <NoteEditor />
          </section>
        </div>
      )}
    </div>
  )
}

export default BrainPage
