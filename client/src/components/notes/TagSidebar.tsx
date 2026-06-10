import { PlusIcon, TagIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { useCreateTag, useTags } from "../../hooks/useTags"
import { useAppStore } from "../../store/useAppStore"

const TAG_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"]

const TagSidebar = () => {
  const { data: tags = [] } = useTags()
  const createTag = useCreateTag()
  const { selectedTagId, setSelectedTagId } = useAppStore()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const color = TAG_COLORS[tags.length % TAG_COLORS.length]
    await createTag.mutateAsync({ name: trimmed, color })
    setName("")
    setIsAdding(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tags</h2>
        <button
          type="button"
          onClick={() => setIsAdding((value) => !value)}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Add tag"
        >
          <PlusIcon size={18} />
        </button>
      </div>

      {isAdding && (
        <div className="border-b border-gray-200 p-3 dark:border-gray-700">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate()
              if (event.key === "Escape") setIsAdding(false)
            }}
            placeholder="Tag name"
            className="w-full text-sm"
            autoFocus
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => setSelectedTagId(null)}
          className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
            selectedTagId === null
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <TagIcon size={16} />
          All notes
        </button>

        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => setSelectedTagId(tag.id)}
            className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
              selectedTagId === tag.id
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TagSidebar
