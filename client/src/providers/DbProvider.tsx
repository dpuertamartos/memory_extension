import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { initDb } from "../lib/db"
import { LoadingTemplate } from "../template/LoadingTemplate"

type DbProviderProps = {
  children: ReactNode
}

const DbProvider = ({ children }: DbProviderProps) => {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initDb()
      .then(() => setReady(true))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("db.initFailed"))
      })
  }, [t])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-red-600">{t("db.error")}</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) return <LoadingTemplate />

  return <>{children}</>
}

export default DbProvider
