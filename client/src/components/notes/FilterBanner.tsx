import { FunnelIcon, XIcon } from "@phosphor-icons/react"
import { useTags } from "../../hooks/useTags"
import { useAppStore } from "../../store/useAppStore"

type FilterBannerProps = {
  noteCount: number
}

const FilterBanner = ({ noteCount }: FilterBannerProps) => {
  const { selectedTagId, setSelectedTagId } = useAppStore()
  const { data: tags = [] } = useTags()

  if (!selectedTagId) return null

  const tag = tags.find((item) => item.id === selectedTagId)
  if (!tag) return null

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950/50">
      <div className="flex items-center gap-2">
        <FunnelIcon size={16} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Filtered by</span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          #{tag.name}
        </span>
        <span className="text-xs text-blue-600/80 dark:text-blue-400/80">
          {noteCount} {noteCount === 1 ? "note" : "notes"}
        </span>
        <button
          type="button"
          onClick={() => setSelectedTagId(null)}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40"
          aria-label="Clear tag filter"
        >
          <XIcon size={14} />
          Clear
        </button>
      </div>
    </div>
  )
}

export default FilterBanner
