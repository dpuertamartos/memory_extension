import { FunnelIcon, XIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useTags } from "../../hooks/useTags"
import { useAppStore } from "../../store/useAppStore"

type FilterBannerProps = {
  noteCount: number
}

const FilterBanner = ({ noteCount }: FilterBannerProps) => {
  const { t } = useTranslation()
  const { selectedTagId, setSelectedTagId } = useAppStore()
  const { data: tags = [] } = useTags()

  if (!selectedTagId) return null

  const tag = tags.find((item) => item.id === selectedTagId)
  if (!tag) return null

  return (
    <div className="border-b border-accent-muted/40 bg-accent-soft px-4 py-2.5 dark:border-accent/30 dark:bg-accent/10">
      <div className="flex items-center gap-2">
        <FunnelIcon size={16} className="shrink-0 text-accent dark:text-accent-muted" aria-hidden />
        <span className="text-xs font-medium text-accent dark:text-accent-muted">
          {t("tags.filteredBy")}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          #{tag.name}
        </span>
        <span className="text-xs text-accent/80 dark:text-accent-muted/80">
          {t("common.note", { count: noteCount })}
        </span>
        <button
          type="button"
          onClick={() => setSelectedTagId(null)}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft dark:text-accent-muted dark:hover:bg-accent/20"
          aria-label={t("tags.clearTagFilter")}
        >
          <XIcon size={14} />
          {t("common.clear")}
        </button>
      </div>
    </div>
  )
}

export default FilterBanner
