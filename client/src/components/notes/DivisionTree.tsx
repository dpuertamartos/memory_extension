import {
  CaretDownIcon,
  CaretRightIcon,
  BrainIcon,
  CheckSquareIcon,
  PencilSimpleIcon,
  PlusIcon,
  ProhibitIcon,
} from "@phosphor-icons/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Division } from "../../db/schema"
import {
  useBootstrapDivisionState,
  useBootstrapSubBrainsEnabled,
  useCreateDivision,
  useDivisionTree,
  useFocusDivision,
  type DivisionTreeNode,
} from "../../hooks/useDivisions"
import { computeCheckboxState, getDescendantIds, getDivisionAncestors } from "../../lib/divisionTree"
import { useAppStore } from "../../store/useAppStore"
import DivisionEditDialog from "./DivisionEditDialog"

type TreeRowProps = {
  node: DivisionTreeNode
  focusDivisionId: string
  includedSet: ReadonlySet<string>
  childrenMap: Map<string | null, Division[]>
  expandedIds: Set<string>
  inactiveLabel: string
  onToggleExpand: (id: string) => void
  onFocus: (id: string) => void
  onToggleIncluded: (id: string, checked: boolean) => void
  onEdit: (division: Division) => void
}

const TreeRow = ({
  node,
  focusDivisionId,
  includedSet,
  childrenMap,
  expandedIds,
  inactiveLabel,
  onToggleExpand,
  onFocus,
  onToggleIncluded,
  onEdit,
}: TreeRowProps) => {
  const { t } = useTranslation()
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isFocused = focusDivisionId === node.id
  const checkboxState = computeCheckboxState(node.id, includedSet, childrenMap)

  return (
    <>
      <div
        className={`group mb-0.5 flex items-center rounded-lg ${
          isFocused ? "row-active" : "hover:bg-accent-soft/50 dark:hover:bg-charcoal"
        }`}
      >
        <button
          type="button"
          onClick={() => (hasChildren ? onToggleExpand(node.id) : undefined)}
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle hover:bg-paper dark:hover:bg-charcoal-elevated"
          aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : undefined}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (
            isExpanded ? (
              <CaretDownIcon size={12} />
            ) : (
              <CaretRightIcon size={12} />
            )
          ) : (
            <span className="w-3" />
          )}
        </button>
        <input
          type="checkbox"
          checked={checkboxState === "checked"}
          ref={(el) => {
            if (el) el.indeterminate = checkboxState === "indeterminate"
          }}
          onChange={(event) => {
            event.stopPropagation()
            onToggleIncluded(node.id, event.target.checked)
          }}
          onClick={(event) => event.stopPropagation()}
          className="mr-2 h-4 w-4 shrink-0 accent-accent"
          aria-label={
            checkboxState === "indeterminate"
              ? t("divisions.includeIndeterminate", { name: node.name })
              : t("divisions.includeDivision", { name: node.name })
          }
          title={t("divisions.includeCheckbox")}
        />
        <button
          type="button"
          onClick={() => onFocus(node.id)}
          className={`flex min-w-0 flex-1 items-center gap-1.5 py-2.5 pr-1 text-left text-sm md:py-2 ${
            isFocused ? "font-medium text-accent dark:text-accent-muted" : "text-ink-muted"
          }`}
          style={{ paddingLeft: `${node.depth * 8}px` }}
        >
          <BrainIcon size={14} className="shrink-0" />
          <span className="truncate">{node.name}</span>
          {!node.isActive && (
            <span className="shrink-0 text-[10px] uppercase text-ink-subtle">{inactiveLabel}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onEdit(node)}
          className="mr-1 rounded p-1 text-ink-subtle opacity-100 hover:bg-paper hover:text-ink-muted md:opacity-0 md:transition-opacity md:group-hover:opacity-100 dark:hover:bg-charcoal-elevated"
          aria-label={`Edit ${node.name}`}
        >
          <PencilSimpleIcon size={12} />
        </button>
      </div>
      {hasChildren &&
        isExpanded &&
        node.children.map((child: DivisionTreeNode) => (
          <TreeRow
            key={child.id}
            node={child}
            focusDivisionId={focusDivisionId}
            includedSet={includedSet}
            childrenMap={childrenMap}
            expandedIds={expandedIds}
            inactiveLabel={inactiveLabel}
            onToggleExpand={onToggleExpand}
            onFocus={onFocus}
            onToggleIncluded={onToggleIncluded}
            onEdit={onEdit}
          />
        ))}
    </>
  )
}

type DivisionTreeProps = {
  className?: string
  compact?: boolean
  collapsible?: boolean
  expanded?: boolean
  onToggle?: () => void
}

const DivisionTree = ({
  className = "",
  compact = false,
  collapsible = false,
  expanded = true,
  onToggle,
}: DivisionTreeProps) => {
  const { t } = useTranslation()
  useBootstrapDivisionState()
  useBootstrapSubBrainsEnabled()
  const { tree, divisions, childrenMap } = useDivisionTree()
  const createDivision = useCreateDivision()
  const { focusDivisionId, focusDivision } = useFocusDivision()
  const { includedDivisionIds, toggleDivisionIncluded, setIncludedDivisionIds } = useAppStore()

  const includedSet = useMemo(() => new Set(includedDivisionIds), [includedDivisionIds])

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set([focusDivisionId]))
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)

  useEffect(() => {
    const ancestors = getDivisionAncestors(divisions, focusDivisionId)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const ancestor of ancestors) next.add(ancestor.id)
      return next
    })
  }, [divisions, focusDivisionId])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleIncluded = (id: string, checked: boolean) => {
    const cascadeIds = getDescendantIds(divisions, id, childrenMap)
    toggleDivisionIncluded(id, checked, cascadeIds)
  }

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    await createDivision.mutateAsync({
      parentId: focusDivisionId,
      name: trimmed,
    })
    setExpandedIds((prev) => new Set([...prev, focusDivisionId]))
    setNewName("")
    setIsAdding(false)
  }

  const visibleDivisionIds = useMemo(
    () => divisions.map((d) => d.id),
    [divisions],
  )

  const handleIncludeAllVisible = () => {
    const next = new Set(includedDivisionIds)
    for (const id of visibleDivisionIds) next.add(id)
    setIncludedDivisionIds([...next].sort())
  }

  const handleClearInclusion = () => {
    setIncludedDivisionIds([])
  }

  const headerActions = (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={handleIncludeAllVisible}
        className="icon-btn !p-1.5"
        aria-label={t("divisions.includeAllVisible")}
        title={t("divisions.includeAllVisible")}
      >
        <CheckSquareIcon size={16} />
      </button>
      <button
        type="button"
        onClick={handleClearInclusion}
        className="icon-btn !p-1.5"
        aria-label={t("divisions.clearInclusion")}
        title={t("divisions.clearInclusion")}
      >
        <ProhibitIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => setIsAdding((v) => !v)}
        className="icon-btn !p-1.5"
        aria-label={t("divisions.newSubBrain")}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  )

  const showBody = !collapsible || expanded

  const sectionHeader = (
    <div className="surface-header flex items-center gap-1 px-3 py-2">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-0.5 text-left"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? t("common.collapseSection", { title: t("divisions.title") })
              : t("common.expandSection", { title: t("divisions.title") })
          }
        >
          {expanded ? (
            <CaretDownIcon className="shrink-0 text-ink-subtle" size={12} aria-hidden />
          ) : (
            <CaretRightIcon className="shrink-0 text-ink-subtle" size={12} aria-hidden />
          )}
          <h2 className="section-label truncate">{t("divisions.title")}</h2>
        </button>
      ) : (
        <h2 className="section-label min-w-0 flex-1 truncate">{t("divisions.title")}</h2>
      )}
      {showBody && headerActions}
    </div>
  )

  return (
    <div
      className={`flex flex-col border-b border-border dark:border-charcoal-border ${
        collapsible && expanded ? "min-h-0 flex-1" : collapsible ? "shrink-0" : compact ? "min-h-0" : "h-full"
      } ${className}`}
    >
      {sectionHeader}

      {showBody && isAdding && (
        <div className="border-b border-border px-3 py-2 dark:border-charcoal-border">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate()
              if (e.key === "Escape") setIsAdding(false)
            }}
            placeholder={t("divisions.namePlaceholder")}
            className="w-full text-sm"
            autoFocus
          />
        </div>
      )}

      {showBody && (
        <div
          className={`overflow-y-auto px-2 py-1.5 ${compact ? "min-h-0 flex-1" : "min-h-0 flex-1"}`}
        >
          {tree.map((node) => (
            <TreeRow
              key={node.id}
              node={node}
              focusDivisionId={focusDivisionId}
              includedSet={includedSet}
              childrenMap={childrenMap}
              expandedIds={expandedIds}
              inactiveLabel={t("divisions.inactiveBadge")}
              onToggleExpand={toggleExpand}
              onFocus={focusDivision}
              onToggleIncluded={handleToggleIncluded}
              onEdit={setEditingDivision}
            />
          ))}
        </div>
      )}

      {editingDivision && (
        <DivisionEditDialog
          division={editingDivision}
          onClose={() => setEditingDivision(null)}
        />
      )}
    </div>
  )
}

export default DivisionTree
