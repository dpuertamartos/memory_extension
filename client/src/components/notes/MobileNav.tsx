import { GearIcon, ListIcon, NotePencilIcon, TagIcon } from "@phosphor-icons/react"
import type { MobilePane } from "../../store/useAppStore"
import { useAppStore } from "../../store/useAppStore"

const items: { pane: MobilePane; label: string; icon: typeof ListIcon }[] = [
  { pane: "tags", label: "Tags", icon: TagIcon },
  { pane: "list", label: "Notes", icon: ListIcon },
  { pane: "editor", label: "Editor", icon: NotePencilIcon },
  { pane: "settings", label: "Settings", icon: GearIcon },
]

const MobileNav = () => {
  const { mobilePane, setMobilePane } = useAppStore()

  return (
    <nav className="flex border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden">
      {items.map(({ pane, label, icon: Icon }) => (
        <button
          key={pane}
          type="button"
          onClick={() => setMobilePane(pane)}
          className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
            mobilePane === pane ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  )
}

export default MobileNav
