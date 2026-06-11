import { useTranslation } from "react-i18next"

export const LoadingTemplate = () => {
  const { t } = useTranslation()
  return <div className="p-6">{t("common.loading")}</div>
}
