import CalendarView from "../components/calendar/CalendarView"
import NoteEditor from "../components/notes/NoteEditor"
import NoteList from "../components/notes/NoteList"
import Omnibox from "../components/notes/Omnibox"
import TagSidebar from "../components/notes/TagSidebar"
import { useAppStore } from "../store/useAppStore"

const BrainPage = () => {
  const { mobilePane, mainView, setMainView } = useAppStore()
  const showCalendar = mainView === "calendar" || mobilePane === "calendar"

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="mb-3 flex gap-1">
          <button
            type="button"
            onClick={() => setMainView("notes")}
            className={`rounded-lg px-3 py-1 text-sm ${
              !showCalendar
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setMainView("calendar")}
            className={`rounded-lg px-3 py-1 text-sm ${
              showCalendar
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Calendar
          </button>
        </div>
        {!showCalendar && <Omnibox />}
      </div>

      {showCalendar ? (
        <CalendarView />
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside
            className={`w-full shrink-0 border-r border-gray-200 transition-opacity duration-200 dark:border-gray-700 md:block md:w-52 lg:w-60 ${
              mobilePane === "tags" ? "block opacity-100" : "hidden opacity-0 md:opacity-100"
            }`}
          >
            <TagSidebar />
          </aside>

          <section
            className={`w-full shrink-0 border-r border-gray-200 transition-opacity duration-200 dark:border-gray-700 md:block md:w-72 lg:w-80 ${
              mobilePane === "list" ? "block opacity-100" : "hidden opacity-0 md:block md:opacity-100"
            }`}
          >
            <NoteList />
          </section>

          <section
            className={`min-w-0 flex-1 transition-opacity duration-200 ${
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
