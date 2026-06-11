import { HardDrivesIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

const LocalTrustBadge = () => {
  const { t } = useTranslation()

  return (
    <span className="trust-badge hidden sm:inline-flex" title={t("nav.localTrustHint")}>
      <HardDrivesIcon size={14} weight="duotone" aria-hidden />
      {t("nav.localOnly")}
    </span>
  )
}

export default LocalTrustBadge
