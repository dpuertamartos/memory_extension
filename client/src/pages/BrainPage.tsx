import NoteEditor from "../components/notes/NoteEditor"
import NoteList from "../components/notes/NoteList"
import Omnibox from "../components/notes/Omnibox"
import TagSidebar from "../components/notes/TagSidebar"
import { useAppStore } from "../store/useAppStore"

const BrainPage = () => {
  const { mobilePane } = useAppStore()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <Omnibox />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`w-full shrink-0 border-r border-gray-200 dark:border-gray-700 md:block md:w-52 lg:w-60 ${
            mobilePane === "tags" ? "block" : "hidden"
          }`}
        >
          <TagSidebar />
        </aside>

        <section
          className={`w-full shrink-0 border-r border-gray-200 dark:border-gray-700 md:block md:w-72 lg:w-80 ${
            mobilePane === "list" ? "block" : "hidden md:block"
          }`}
        >
          <NoteList />
        </section>

        <section
          className={`min-w-0 flex-1 ${
            mobilePane === "editor" ? "block" : "hidden md:block"
          }`}
        >
          <NoteEditor />
        </section>
      </div>
    </div>
  )
}

export default BrainPage
