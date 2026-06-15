import { DeviceMobileIcon, DownloadSimpleIcon, HardDrivesIcon, UploadSimpleIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { usePwaInstall } from "../hooks/usePwaInstall"
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../i18n"
import { exportDatabaseFile, importDatabaseFile } from "../lib/db"
import { exportNotesAsMarkdownZip } from "../lib/exportMarkdown"
import { useAppStore } from "../store/useAppStore"
import { useLocaleStore } from "../store/useLocaleStore"

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

type SettingsPageProps = {
  embedded?: boolean
}

const SettingsPage = ({ embedded = false }: SettingsPageProps) => {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocaleStore()
  const {
    showInactiveDivisions,
    setShowInactiveDivisions,
    subBrainsEnabled,
    setSubBrainsEnabled,
  } = useAppStore()
  const { canInstall, isInstalled, showIosHint, promptInstall } = usePwaInstall()

  const handleSubBrainsToggle = (enabled: boolean) => {
    if (enabled) {
      setSubBrainsEnabled(true)
      return
    }

    const step1 = window.confirm(t("settings.disableSubBrainsConfirm1"))
    if (!step1) return

    const step2 = window.confirm(t("settings.disableSubBrainsConfirm2"))
    if (!step2) return

    setSubBrainsEnabled(false)
  }

  const handleSqliteExport = async () => {
    const blob = await exportDatabaseFile()
    downloadBlob(blob, "local-brain.sqlite")
  }

  const handleMarkdownExport = async () => {
    const blob = await exportNotesAsMarkdownZip(t("common.untitled"))
    downloadBlob(blob, "local-brain-notes.zip")
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(t("settings.importConfirm"))
    if (!confirmed) return

    await importDatabaseFile(file)
    window.location.reload()
  }

  return (
    <div className={`mx-auto max-w-lg ${embedded ? "px-3 py-4 sm:px-4" : "p-4 sm:p-6"}`}>
      {!embedded && <h1>{t("settings.title")}</h1>}
      <p className={`text-sm text-ink-muted ${embedded ? "mb-4" : "mb-6"}`}>
        {t("settings.description")}
      </p>

      <div className="space-y-4">
        <div className="rounded-lg border border-synapse/30 bg-synapse-soft p-4 dark:border-synapse/40 dark:bg-synapse/10">
          <div className="mb-2 flex items-center gap-2">
            <HardDrivesIcon size={20} className="text-synapse dark:text-synapse-soft" />
            <h2 className="text-sm font-semibold text-synapse dark:text-synapse-soft">
              {t("settings.privacyTitle")}
            </h2>
          </div>
          <p className="text-sm text-ink-muted dark:text-charcoal-muted">{t("settings.privacyBody")}</p>
        </div>

        <div className="surface-inset p-4">
          <label htmlFor="locale-select" className="mb-1 block text-sm font-medium">
            {t("settings.language")}
          </label>
          <p className="mb-3 text-xs text-ink-subtle">{t("settings.languageDescription")}</p>
          <select
            id="locale-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
            className="w-full rounded-md border border-border bg-paper-elevated px-3 py-2 text-sm dark:border-charcoal-border dark:bg-charcoal"
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="surface-inset p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={subBrainsEnabled}
              onChange={(event) => handleSubBrainsToggle(event.target.checked)}
            />
            {t("settings.enableSubBrains")}
          </label>
          <p className="mt-2 text-xs text-ink-subtle">{t("settings.enableSubBrainsDescription")}</p>
        </div>

        {subBrainsEnabled && (
          <div className="surface-inset p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showInactiveDivisions}
                onChange={(event) => setShowInactiveDivisions(event.target.checked)}
              />
              {t("divisions.showInactive")}
            </label>
            <p className="mt-2 text-xs text-ink-subtle">{t("divisions.showInactiveHint")}</p>
          </div>
        )}

        {isInstalled ? (
          <p className="rounded-lg border border-synapse/30 bg-synapse-soft px-4 py-3 text-sm text-synapse dark:border-synapse/40 dark:bg-synapse/10 dark:text-synapse-soft">
            {t("settings.installed")}
          </p>
        ) : canInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <DeviceMobileIcon size={18} />
            {t("settings.installApp")}
          </button>
        ) : showIosHint ? (
          <div className="surface-inset px-4 py-3 text-sm text-ink-muted">
            <p className="mb-1 font-medium text-ink dark:text-stone-200">{t("settings.iosTitle")}</p>
            <p>{t("settings.iosHint")}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSqliteExport()}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          {t("settings.exportSqlite")}
        </button>

        <button
          type="button"
          onClick={() => void handleMarkdownExport()}
          className="btn-secondary flex w-full items-center justify-center gap-2"
        >
          <DownloadSimpleIcon size={18} />
          {t("settings.exportMarkdown")}
        </button>

        <label className="btn-muted flex w-full cursor-pointer items-center justify-center gap-2">
          <UploadSimpleIcon size={18} />
          {t("settings.importSqlite")}
          <input
            type="file"
            accept=".sqlite,.db,application/x-sqlite3"
            className="hidden"
            onChange={(event) => void handleImport(event)}
          />
        </label>
      </div>
    </div>
  )
}

export default SettingsPage
