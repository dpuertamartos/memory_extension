import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { useAppStore } from "../../store/useAppStore"

const Omnibox = () => {
  const { searchQuery, setSearchQuery } = useAppStore()

  return (
    <div className="relative">
      <MagnifyingGlassIcon
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search notes…"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm dark:border-gray-600 dark:bg-gray-800"
        aria-label="Search notes"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <XIcon size={16} />
        </button>
      )}
    </div>
  )
}

export default Omnibox
