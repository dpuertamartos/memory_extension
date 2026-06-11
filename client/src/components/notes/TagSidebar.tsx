import { MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, TagIcon, XIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Tag } from "../../db/schema"
import { useCreateTag, useTags } from "../../hooks/useTags"
import { useAppStore } from "../../store/useAppStore"
import TagEditDialog from "./TagEditDialog"

const TAG_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"]

const TagSidebar = () => {
  const { t } = useTranslation()
  const { data: tags = [] } = useTags()
  const createTag = useCreateTag()
  const { selectedTagId, setSelectedTagId } = useAppStore()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [filter, setFilter] = useState("")
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  const filterLower = filter.trim().toLowerCase()
  const visibleTags = filterLower
    ? tags.filter((tag) => tag.name.toLowerCase().includes(filterLower))
    : tags

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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t("tags.title")}
        </h2>
        <button
          type="button"
          onClick={() => setIsAdding((value) => !value)}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={t("tags.addTag")}
        >
          <PlusIcon size={18} />
        </button>
      </div>

      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 dark:border-gray-600 dark:bg-gray-800">
          <MagnifyingGlassIcon className="shrink-0 text-gray-400" size={14} aria-hidden />
          <input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t("tags.filterTagsPlaceholder")}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            aria-label={t("tags.filterTags")}
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
              aria-label={t("tags.clearTagFilter")}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
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
            placeholder={t("tags.tagName")}
            className="w-full text-sm"
            autoFocus
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => setSelectedTagId(null)}
          className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition-colors duration-150 md:py-2 ${
            selectedTagId === null
              ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <TagIcon size={16} />
          {t("tags.allNotes")}
        </button>

        {visibleTags.length === 0 && filterLower && (
          <p className="px-3 py-2 text-xs text-gray-500">
            {t("tags.noTagsMatch", { filter })}
          </p>
        )}

        {visibleTags.map((tag) => (
          <div
            key={tag.id}
            className={`group mb-1 flex items-center rounded-lg ${
              selectedTagId === tag.id
                ? "bg-blue-50 dark:bg-blue-900/30"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedTagId(tag.id)}
              className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left text-sm transition-colors duration-150 md:py-2 ${
                selectedTagId === tag.id
                  ? "font-medium text-blue-700 dark:text-blue-300"
                  : ""
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="truncate">{tag.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setEditingTag(tag)}
              className="mr-1 rounded p-1.5 text-gray-400 opacity-100 hover:bg-gray-200 hover:text-gray-600 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 dark:hover:bg-gray-600 dark:hover:text-gray-200"
              aria-label={t("tags.editTagNamed", { name: tag.name })}
            >
              <PencilSimpleIcon size={14} />
            </button>
          </div>
        ))}
      </div>

      {editingTag && (
        <TagEditDialog
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onDeleted={() => {
            if (selectedTagId === editingTag.id) setSelectedTagId(null)
          }}
        />
      )}
    </div>
  )
}

export default TagSidebar
