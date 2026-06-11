import MemoryMark from "../components/brand/MemoryMark"

type LogoAppProps = {
  compact?: boolean
}

const LogoApp = ({ compact = false }: LogoAppProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <MemoryMark className="h-8 w-8 shrink-0 text-accent dark:text-accent-muted" />
        <span className="font-display text-sm font-semibold tracking-tight text-ink dark:text-stone-100">
          Local Brain
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="mt-4 flex justify-center">
        <MemoryMark className="h-16 w-16 text-accent dark:text-accent-muted" />
      </div>
      <div className="mt-2 flex justify-center">
        <span className="font-display text-sm font-semibold text-ink dark:text-stone-100">
          Local Brain
        </span>
      </div>
    </div>
  )
}

export default LogoApp
