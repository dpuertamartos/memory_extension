import { WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

type Props = {
  message: string
}

const ErrorTemplate = (props: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper p-6 text-center dark:bg-charcoal">
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-950/40">
        <WarningCircleIcon size={32} className="text-red-600 dark:text-red-400" />
      </div>
      <p className="font-display text-lg font-semibold text-ink dark:text-stone-100">
        {t("db.error")}
      </p>
      <p className="max-w-sm text-sm text-ink-muted dark:text-charcoal-muted">{props.message}</p>
    </div>
  )
}

export default ErrorTemplate
