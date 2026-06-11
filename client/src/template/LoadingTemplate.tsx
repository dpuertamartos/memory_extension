import { useTranslation } from "react-i18next"
import MemoryMark from "../components/brand/MemoryMark"

export const LoadingTemplate = () => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper p-6 dark:bg-charcoal">
      <MemoryMark className="h-14 w-14 animate-pulse text-accent dark:text-accent-muted" />
      <p className="text-sm text-ink-muted dark:text-charcoal-muted">{t("db.opening")}</p>
    </div>
  )
}
