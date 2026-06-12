import { useTranslation } from "react-i18next"
import type { DayActivity } from "../../hooks/useCalendarNotes"

type ActivityDotsProps = {
  activity: DayActivity | undefined
}

const ActivityDots = ({ activity }: ActivityDotsProps) => {
  const { t } = useTranslation()
  if (!activity) return null

  return (
    <div className="mt-0.5 flex justify-center gap-0.5">
      {activity.created > 0 && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-pulse-create"
          title={t("calendar.activityCreated")}
        />
      )}
      {activity.updated > 0 && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-pulse-update"
          title={t("calendar.activityUpdated")}
        />
      )}
    </div>
  )
}

export default ActivityDots
