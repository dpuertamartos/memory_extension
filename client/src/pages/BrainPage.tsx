import CalendarView from "../components/calendar/CalendarView"
import DivisionTree from "../components/notes/DivisionTree"
import NoteEditor from "../components/notes/NoteEditor"
import NoteList from "../components/notes/NoteList"
import Omnibox from "../components/notes/Omnibox"
import TagSidebar from "../components/notes/TagSidebar"
import DivisionBreadcrumb from "../components/notes/DivisionBreadcrumb"
import { useIsDesktop } from "../hooks/useMediaQuery"
import { useAppStore } from "../store/useAppStore"

const BrainPage = () => {
  const { activePane, subBrainsEnabled, selectedNoteId } = useAppStore()
  const isDesktop = useIsDesktop()

  const showList = activePane === "list" && (isDesktop || !selectedNoteId)
  const showEditor = activePane === "list" && (isDesktop || Boolean(selectedNoteId))

  return (
    <div className="flex h-full min-h-0 flex-col">
      {activePane === "list" && (
        <div className="surface-header shrink-0 px-3 py-2.5 md:px-4 md:py-3">
          {subBrainsEnabled && <DivisionBreadcrumb />}
          <Omnibox />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {activePane === "calendar" && <CalendarView />}

        {activePane === "tags" && <TagSidebar mobileOnly />}

        {activePane === "divisions" && subBrainsEnabled && (
          <div className="flex h-full min-h-0 flex-col">
            <DivisionTree className="h-full flex-1 border-b-0" />
          </div>
        )}

        {activePane === "list" && (
          <div className="flex h-full min-h-0">
            {showList && (
              <section className="surface-panel flex min-h-0 w-full flex-col border-r border-border dark:border-charcoal-border md:w-96 md:min-w-80 lg:min-w-96 lg:flex-[2] lg:max-w-xl">
                <NoteList />
              </section>
            )}

            {showEditor && (
              <section className="surface-app flex min-h-0 min-w-0 flex-1 flex-col md:max-w-2xl lg:max-w-xl xl:max-w-2xl">
                <NoteEditor />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrainPage
