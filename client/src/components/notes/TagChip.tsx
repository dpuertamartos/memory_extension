import { PencilSimpleIcon, XIcon } from "@phosphor-icons/react"
import type { Tag } from "../../db/schema"

type TagChipProps = {
  tag: Pick<Tag, "id" | "name" | "color">
  size?: "xs" | "sm"
  showHash?: boolean
  suffix?: string
  onEdit?: () => void
  editLabel?: string
  onRemove?: () => void
  removeLabel?: string
}

const sizeClasses = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2 py-0.5 text-xs",
}

const TagChip = ({
  tag,
  size = "sm",
  showHash = true,
  suffix,
  onEdit,
  editLabel,
  onRemove,
  removeLabel,
}: TagChipProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${sizeClasses[size]}`}
    style={{ backgroundColor: tag.color }}
  >
    {showHash ? `#${tag.name}` : tag.name}
    {suffix}
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="rounded hover:opacity-80"
        aria-label={editLabel}
      >
        <PencilSimpleIcon size={12} />
      </button>
    )}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="rounded hover:opacity-80"
        aria-label={removeLabel}
      >
        <XIcon size={12} />
      </button>
    )}
  </span>
)

export default TagChip
