import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Tag } from "../../db/schema"
import { useCreateTag, useTags } from "../../hooks/useTags"
import { useSetNoteTags } from "../../hooks/useNotes"

type TagSelectorProps = {
  noteId: string
  selectedTags: Tag[]
  anchor: { top: number; left: number }
  query: string
  onClose: () => void
  onTagApplied?: () => void
}

const TagSelector = ({ noteId, selectedTags, anchor, query, onClose, onTagApplied }: TagSelectorProps) => {
  const { t } = useTranslation()
  const { data: tags = [] } = useTags()
  const createTag = useCreateTag()
  const setNoteTags = useSetNoteTags()
  const ref = useRef<HTMLDivElement>(null)
  const [highlight, setHighlight] = useState(0)

  const normalized = query.toLowerCase()
  const filtered = tags.filter((tag) => tag.name.toLowerCase().includes(normalized))
  const selectedIds = new Set(selectedTags.map((tag) => tag.id))
  const canCreate = normalized.length > 0 && !tags.some((tag) => tag.name.toLowerCase() === normalized)
  const createLabel = t("tags.createTag", { name: query })
  const options = canCreate
    ? [...filtered, { id: "__create__", name: createLabel } as Tag]
    : filtered

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  const applyTag = async (tag: Tag) => {
    if (selectedIds.has(tag.id)) {
      onTagApplied?.()
      onClose()
      return
    }

    await setNoteTags.mutateAsync({
      noteId,
      tagIds: [...selectedTags.map((item) => item.id), tag.id],
    })
    onTagApplied?.()
    onClose()
  }

  const handleSelect = async (option: Tag | { id: string; name: string }) => {
    if (option.id === "__create__") {
      const tag = await createTag.mutateAsync({ name: query })
      await setNoteTags.mutateAsync({
        noteId,
        tagIds: [...selectedTags.map((item) => item.id), tag.id],
      })
      onTagApplied?.()
      onClose()
      return
    }

    await applyTag(option as Tag)
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 min-w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
      style={{ top: anchor.top, left: anchor.left }}
    >
      {options.length === 0 ? (
        <p className="px-3 py-2 text-sm text-gray-500">{t("tags.noTagsFound")}</p>
      ) : (
        options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            onMouseEnter={() => setHighlight(index)}
            onClick={() => void handleSelect(option)}
            className={`block w-full px-3 py-2 text-left text-sm ${
              highlight === index ? "bg-gray-100 dark:bg-gray-700" : ""
            }`}
          >
            {option.id === "__create__" ? option.name : `#${option.name}`}
          </button>
        ))
      )}
    </div>
  )
}

export default TagSelector
