import { CalendarBlankIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { useRef, useState } from "react"
import {
  datePresetLabel,
  type DateField,
  type DatePreset,
} from "../../lib/searchQuery"
import { useTags } from "../../hooks/useTags"
import { useAppStore } from "../../store/useAppStore"

const DATE_PRESETS: DatePreset[] = ["last_week", "last_month", "this_month", "this_year"]

const Omnibox = () => {
  const { searchFilters, updateSearchFilters, clearSearchFilters } = useAppStore()
  const { data: tags = [] } = useTags()
  const [inputValue, setInputValue] = useState("")
  const [showDateMenu, setShowDateMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
            <span
              key={keyword}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="rounded hover:text-blue-600"
                aria-label={`Remove keyword ${keyword}`}
              >
                <XIcon size={12} />
              </button>
            </span>
          ))}

          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="rounded hover:opacity-80"
                aria-label={`Remove tag filter ${tag.name}`}
              >
                <XIcon size={12} />
              </button>
            </span>
          ))}

          {searchFilters.datePreset && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              <CalendarBlankIcon size={12} />
              {datePresetLabel(searchFilters.datePreset, searchFilters.dateField)}
              <button
                type="button"
                onClick={() => setDatePreset(null)}
                className="rounded hover:text-gray-900 dark:hover:text-white"
                aria-label="Remove date filter"
              >
                <XIcon size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-600 dark:bg-gray-800">
          <MagnifyingGlassIcon className="shrink-0 text-gray-400" size={18} aria-hidden />
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
            placeholder="Add keywords or #tags…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
            aria-label="Search notes"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                clearSearchFilters()
                setInputValue("")
              }}
              className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
              aria-label="Clear all filters"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmitInput}
          disabled={!inputValue.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          aria-label="Add search term"
        >
          <MagnifyingGlassIcon size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDateMenu((value) => !value)}
            className={`flex h-full items-center gap-1 rounded-lg border px-3 text-sm ${
              searchFilters.datePreset
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
            aria-label="Date filter"
            aria-expanded={showDateMenu}
          >
            <CalendarBlankIcon size={16} />
            <span className="hidden sm:inline">Date</span>
          </button>

          {showDateMenu && (
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                <p className="mb-1 text-xs font-medium text-gray-500">Filter by</p>
                <div className="flex gap-1">
                  {(["updated", "created"] as DateField[]).map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => setDateField(field)}
                      className={`flex-1 rounded px-2 py-1 text-xs capitalize ${
                        searchFilters.dateField === field
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {field}
                    </button>
                  ))}
                </div>
              </div>

              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    searchFilters.datePreset === preset ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                >
                  {datePresetLabel(preset, searchFilters.dateField)}
                </button>
              ))}

              {searchFilters.datePreset && (
                <button
                  type="button"
                  onClick={() => setDatePreset(null)}
                  className="block w-full border-t border-gray-100 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Clear date filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Omnibox
