import {
  CaretDownIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TagIcon,
  XIcon,
} from "@phosphor-icons/react"
import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Tag } from "../../db/schema"
import { useCreateTag, useTags } from "../../hooks/useTags"
import { TAG_COLORS } from "../../lib/tagColors"
import { useAppStore } from "../../store/useAppStore"
import TagEditDialog from "./TagEditDialog"
import DivisionTree from "./DivisionTree"

const SIDEBAR_DIVISIONS_EXPANDED_KEY = "sidebar-section-divisions-expanded"
const SIDEBAR_TAGS_EXPANDED_KEY = "sidebar-section-tags-expanded"

function readStoredExpanded(key: string, defaultValue: boolean): boolean {
  try {
    const stored = localStorage.getItem(key)
    if (stored !== null) return stored === "true"
  } catch {
    /* ignore */
  }
  return defaultValue
}

function persistExpanded(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* ignore */
  }
}

type SidebarSectionProps = {
  title: string
  expanded: boolean
  onToggle: () => void
  headerActions?: ReactNode
  children: ReactNode
}

const SidebarSection = ({ title, expanded, onToggle, headerActions, children }: SidebarSectionProps) => {
  const { t } = useTranslation()

  return (
    <section
      className={`flex min-h-0 flex-col border-b border-border dark:border-charcoal-border ${
        expanded ? "min-h-[5rem] flex-1" : "shrink-0"
      }`}
    >
      <div className="surface-header flex items-center gap-1 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-0.5 text-left"
          aria-expanded={expanded}
          aria-label={expanded ? t("common.collapseSection", { title }) : t("common.expandSection", { title })}
        >
          {expanded ? (
            <CaretDownIcon className="shrink-0 text-ink-subtle" size={12} aria-hidden />
          ) : (
            <CaretRightIcon className="shrink-0 text-ink-subtle" size={12} aria-hidden />
          )}
          <h2 className="section-label truncate">{title}</h2>
        </button>
        {expanded && headerActions}
      </div>
      {expanded && <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>}
    </section>
  )
}

type AddTagFormProps = {
  value: string
  isPending: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

const AddTagForm = ({ value, isPending, onChange, onSubmit, onCancel }: AddTagFormProps) => {
  const { t } = useTranslation()
  const canSubmit = value.trim().length > 0 && !isPending

  return (
    <div className="border-b border-border p-3 dark:border-charcoal-border">
      <p className="mb-1 text-[11px] text-ink-subtle">{t("tags.newTag")}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSubmit) void onSubmit()
          if (e.key === "Escape") onCancel()
        }}
        placeholder={t("tags.namePlaceholder")}
        className="w-full text-sm"
        autoFocus
        disabled={isPending}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit}
          className="btn-primary !px-3 !py-1.5 text-xs"
        >
          {t("tags.createTagAction")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  )
}

type TagSidebarProps = {
  mobileOnly?: boolean
}

const TagSidebar = ({ mobileOnly = false }: TagSidebarProps) => {
  const { t } = useTranslation()
  const { data: tags = [] } = useTags()
  const createTag = useCreateTag()
  const { selectedTagId, setSelectedTagId, subBrainsEnabled } = useAppStore()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [filter, setFilter] = useState("")
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [divisionsExpanded, setDivisionsExpanded] = useState(() =>
    readStoredExpanded(SIDEBAR_DIVISIONS_EXPANDED_KEY, true),
  )
  const [tagsExpanded, setTagsExpanded] = useState(() => readStoredExpanded(SIDEBAR_TAGS_EXPANDED_KEY, true))

  const toggleDivisions = () => {
    setDivisionsExpanded((value) => {
      const next = !value
      persistExpanded(SIDEBAR_DIVISIONS_EXPANDED_KEY, next)
      return next
    })
  }

  const toggleTags = () => {
    setTagsExpanded((value) => {
      const next = !value
      persistExpanded(SIDEBAR_TAGS_EXPANDED_KEY, next)
      return next
    })
  }

  const filterLower = filter.trim().toLowerCase()
  const visibleTags = filterLower
    ? tags.filter((tag) => tag.name.toLowerCase().includes(filterLower))
    : tags

  const startAdd = () => {
    setIsAdding(true)
    setName("")
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setName("")
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const color = TAG_COLORS[tags.length % TAG_COLORS.length]
    await createTag.mutateAsync({ name: trimmed, color })
    cancelAdd()
  }

  const tagHeaderActionsDesktop = (
    <button
      type="button"
      onClick={startAdd}
      className="icon-btn !p-1.5"
      aria-label={t("tags.addTag")}
    >
      <PlusIcon size={18} />
    </button>
  )

  const tagHeaderActionsMobile = (
    <button
      type="button"
      onClick={startAdd}
      className="btn-primary flex shrink-0 items-center gap-1.5 !px-3 !py-1.5 text-xs"
    >
      <PlusIcon size={14} />
      {t("tags.addTag")}
    </button>
  )

  const tagsContent = (
    <>
        <div className="border-b border-border p-3 dark:border-charcoal-border">
          <div className="surface-inset flex items-center gap-2 px-2.5">
            <MagnifyingGlassIcon className="shrink-0 text-ink-subtle" size={14} aria-hidden />
            <input
              type="text"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={t("tags.filterTagsPlaceholder")}
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm shadow-none outline-none focus:ring-0"
              aria-label={t("tags.filterTags")}
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter("")}
                className="shrink-0 rounded p-0.5 text-ink-subtle hover:text-ink-muted"
                aria-label={t("tags.clearTagFilter")}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {isAdding && (
          <AddTagForm
            value={name}
            isPending={createTag.isPending}
            onChange={setName}
            onSubmit={handleCreate}
            onCancel={cancelAdd}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => setSelectedTagId(null)}
            className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm transition-colors duration-150 md:py-2 ${
              selectedTagId === null
                ? "row-active font-medium text-accent dark:text-accent-muted"
                : "text-ink-muted hover:bg-accent-soft/50 dark:text-charcoal-muted dark:hover:bg-charcoal"
            }`}
          >
            <TagIcon size={16} />
            {t("tags.allNotes")}
          </button>

          {visibleTags.length === 0 && filterLower && (
            <p className="px-3 py-2 text-xs text-ink-subtle">{t("tags.noTagsMatch", { filter })}</p>
          )}

          {visibleTags.map((tag) => (
            <div
              key={tag.id}
              className={`group mb-1 flex items-center rounded-lg ${
                selectedTagId === tag.id ? "row-active" : "hover:bg-accent-soft/50 dark:hover:bg-charcoal"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedTagId(tag.id)}
                className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left text-sm transition-colors duration-150 md:py-2 ${
                  selectedTagId === tag.id ? "font-medium text-accent dark:text-accent-muted" : ""
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingTag(tag)}
                className="mr-1 rounded p-1.5 text-ink-subtle opacity-100 hover:bg-paper hover:text-ink-muted md:opacity-0 md:transition-opacity md:group-hover:opacity-100 dark:hover:bg-charcoal-elevated dark:hover:text-stone-200"
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
    </>
  )

  if (mobileOnly) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="surface-header flex items-center justify-between px-3 py-2">
          <h2 className="section-label">{t("tags.title")}</h2>
          {tagHeaderActionsMobile}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{tagsContent}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {subBrainsEnabled && (
        <DivisionTree
          compact
          collapsible
          expanded={divisionsExpanded}
          onToggle={toggleDivisions}
          className="hidden md:flex"
        />
      )}

      <SidebarSection
        title={t("tags.title")}
        expanded={tagsExpanded}
        onToggle={toggleTags}
        headerActions={tagHeaderActionsDesktop}
      >
        {tagsContent}
      </SidebarSection>
    </div>
  )
}

export default TagSidebar
