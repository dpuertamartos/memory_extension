import { CaretDownIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAllDivisions } from "../../hooks/useDivisions"
import { getDivisionAncestors } from "../../lib/divisionTree"

type DivisionPickerProps = {
  value: string
  onChange: (divisionId: string) => void
  disabled?: boolean
  compact?: boolean
  className?: string
}

const DivisionPicker = ({ value, onChange, disabled, compact = false, className = "" }: DivisionPickerProps) => {
  const { t } = useTranslation()
  const { data: divisions = [] } = useAllDivisions()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const options = useMemo(() => {
    return divisions
      .filter((d) => !d.isDeleted)
      .map((division) => {
        const ancestors = getDivisionAncestors(divisions, division.id)
        const path = ancestors.map((a) => a.name).join(" › ")
        return { division, path }
      })
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [divisions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => opt.path.toLowerCase().includes(q))
  }, [options, query])

  const selectedPath = options.find((opt) => opt.division.id === value)?.path ?? ""

  const handleSelect = (divisionId: string) => {
    onChange(divisionId)
    setOpen(false)
    setQuery("")
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-1.5 rounded-md border border-border bg-paper-elevated text-left dark:border-charcoal-border dark:bg-charcoal disabled:opacity-50 ${
          compact ? "px-2 py-1 text-xs" : "gap-2 rounded-lg px-3 py-2 text-sm"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 flex-1 truncate text-ink-muted">{selectedPath}</span>
        <CaretDownIcon size={14} className="shrink-0 text-ink-subtle" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-paper-elevated shadow-lg dark:border-charcoal-border dark:bg-charcoal">
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2 dark:border-charcoal-border">
            <MagnifyingGlassIcon size={14} className="shrink-0 text-ink-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("divisions.searchPlaceholder")}
              className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm shadow-none outline-none focus:ring-0"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-ink-subtle">{t("divisions.noMatch")}</li>
            )}
            {filtered.map(({ division, path }) => (
              <li key={division.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={division.id === value}
                  onClick={() => handleSelect(division.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent-soft/50 dark:hover:bg-charcoal ${
                    division.id === value ? "row-active font-medium" : "text-ink-muted"
                  }`}
                >
                  <span className="truncate">{path}</span>
                  {!division.isActive && (
                    <span className="shrink-0 text-[10px] uppercase text-ink-subtle">
                      {t("divisions.inactiveBadge")}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DivisionPicker
