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
    </div>
  )
}

export default BrainPage
