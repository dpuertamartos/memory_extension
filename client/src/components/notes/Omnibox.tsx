import { CalendarBlankIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { type DateField, type DatePreset } from "../../lib/searchQuery"
import { useTags } from "../../hooks/useTags"
import { useAppStore } from "../../store/useAppStore"
import TagChip from "./TagChip"

const DATE_PRESETS: DatePreset[] = ["last_week", "last_month", "this_month", "this_year"]

const Omnibox = () => {
  const { t } = useTranslation()
  const { searchFilters, updateSearchFilters, clearSearchFilters } = useAppStore()
  const { data: tags = [] } = useTags()
  const [inputValue, setInputValue] = useState("")
  const [showDateMenu, setShowDateMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const datePresetLabel = (preset: DatePreset, field: DateField) =>
    t(`search.datePreset.${preset}`, {
      field: t(field === "created" ? "common.created" : "common.updated"),
    })

  const addKeyword = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    if (trimmed.startsWith("#")) {
      const tagName = trimmed.slice(1).trim().toLowerCase()
      const tag = tags.find((item) => item.name.toLowerCase() === tagName)
      if (tag && !searchFilters.tagIds.includes(tag.id)) {
        updateSearchFilters({ tagIds: [...searchFilters.tagIds, tag.id] })
      }
      return
    }

    const keyword = trimmed.toLowerCase()
    if (!searchFilters.keywords.includes(keyword)) {
      updateSearchFilters({ keywords: [...searchFilters.keywords, keyword] })
    }
  }

  const handleSubmitInput = () => {
    addKeyword(inputValue)
    setInputValue("")
  }

  const removeKeyword = (keyword: string) => {
    updateSearchFilters({
      keywords: searchFilters.keywords.filter((item) => item !== keyword),
    })
  }

  const removeTag = (tagId: string) => {
    updateSearchFilters({
      tagIds: searchFilters.tagIds.filter((id) => id !== tagId),
    })
  }

  const setDatePreset = (preset: DatePreset | null) => {
    updateSearchFilters({ datePreset: preset, dateFrom: null, dateTo: null })
    setShowDateMenu(false)
  }

  const setDateField = (field: DateField) => {
    updateSearchFilters({ dateField: field })
  }

  const hasFilters =
    searchFilters.keywords.length > 0 ||
    searchFilters.tagIds.length > 0 ||
    searchFilters.datePreset !== null ||
    searchFilters.dateFrom !== null ||
    searchFilters.dateTo !== null

  const selectedTags = tags.filter((tag) => searchFilters.tagIds.includes(tag.id))

  return (
    <div className="space-y-2">
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {searchFilters.keywords.map((keyword) => (
            <span key={keyword} className="chip-keyword">
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="rounded hover:text-accent-hover"
                aria-label={t("search.removeKeyword", { keyword })}
              >
                <XIcon size={12} />
              </button>
            </span>
          ))}

          {selectedTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={() => removeTag(tag.id)}
              removeLabel={t("search.removeTagFilter", { name: tag.name })}
            />
          ))}

          {searchFilters.datePreset && (
            <span className="chip-muted">
              <CalendarBlankIcon size={12} />
              {datePresetLabel(searchFilters.datePreset, searchFilters.dateField)}
              <button
                type="button"
                onClick={() => setDatePreset(null)}
                className="rounded hover:text-ink dark:hover:text-stone-200"
                aria-label={t("search.removeDateFilter")}
              >
                <XIcon size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="toolbar-compact">
        <div className="surface-inset flex min-w-0 flex-1 items-center gap-2 px-3">
          <MagnifyingGlassIcon className="shrink-0 text-ink-subtle" size={18} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleSubmitInput()
              }
            }}
            placeholder={t("search.placeholder")}
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm shadow-none outline-none focus:ring-0"
            aria-label={t("search.searchNotes")}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                clearSearchFilters()
                setInputValue("")
              }}
              className="shrink-0 rounded p-1 text-ink-subtle hover:text-ink-muted"
              aria-label={t("search.clearAllFilters")}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        <div className="toolbar-compact-actions">
        <button
          type="button"
          onClick={handleSubmitInput}
          disabled={!inputValue.trim()}
          className="btn-primary flex shrink-0 items-center gap-1.5 !px-3 !py-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t("search.addSearchTerm")}
        >
          <MagnifyingGlassIcon size={16} className="sm:hidden" />
          <span className="hidden sm:inline">{t("common.search")}</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDateMenu((value) => !value)}
            className={`flex h-full items-center gap-1 rounded-lg border px-3 text-sm transition-colors ${
              searchFilters.datePreset
                ? "border-accent-muted bg-accent-soft text-accent dark:border-accent/50 dark:bg-accent/15 dark:text-accent-muted"
                : "surface-inset text-ink-muted"
            }`}
            aria-label={t("search.dateFilter")}
            aria-expanded={showDateMenu}
          >
            <CalendarBlankIcon size={16} />
            <span className="hidden sm:inline">{t("common.date")}</span>
          </button>

          {showDateMenu && (
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-border bg-paper-elevated py-1 shadow-panel dark:border-charcoal-border dark:bg-charcoal-elevated">
              <div className="border-b border-border px-3 py-2 dark:border-charcoal-border">
                <p className="mb-1 text-xs font-medium text-ink-subtle">{t("search.filterBy")}</p>
                <div className="flex gap-1">
                  {(["updated", "created"] as DateField[]).map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => setDateField(field)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs ${
                        searchFilters.dateField === field
                          ? "bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-muted"
                          : "text-ink-muted hover:bg-paper dark:text-charcoal-muted dark:hover:bg-charcoal"
                      }`}
                    >
                      {t(field === "created" ? "common.created" : "common.updated")}
                    </button>
                  ))}
                </div>
              </div>

              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-paper dark:hover:bg-charcoal ${
                    searchFilters.datePreset === preset ? "text-accent dark:text-accent-muted" : ""
                  }`}
                >
                  {datePresetLabel(preset, searchFilters.dateField)}
                </button>
              ))}

              {searchFilters.datePreset && (
                <button
                  type="button"
                  onClick={() => setDatePreset(null)}
                  className="block w-full border-t border-border px-3 py-2 text-left text-sm text-red-600 hover:bg-paper dark:border-charcoal-border dark:hover:bg-charcoal"
                >
                  {t("search.clearDateFilter")}
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

export default Omnibox
