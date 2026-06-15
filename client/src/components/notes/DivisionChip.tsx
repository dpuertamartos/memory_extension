import { BrainIcon } from "@phosphor-icons/react"

type DivisionChipProps = {
  label: string
  size?: "xs" | "sm"
}

const sizeClasses = {
  xs: "px-2 py-0.5 text-[10px] gap-1",
  sm: "px-2 py-0.5 text-xs gap-1",
}

const DivisionChip = ({ label, size = "sm" }: DivisionChipProps) => (
  <span
    className={`inline-flex max-w-full items-center rounded-full bg-accent-soft font-medium text-accent dark:bg-accent/15 dark:text-accent-muted ${sizeClasses[size]}`}
  >
    <BrainIcon size={size === "xs" ? 10 : 12} className="shrink-0" />
    <span className="truncate">{label}</span>
  </span>
)

export default DivisionChip
