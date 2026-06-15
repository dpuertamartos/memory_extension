import {
  CaretDownIcon,
  CaretRightIcon,
  BrainIcon,
  ListIcon,
  PencilSimpleIcon,
  PlusIcon,
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
import { getDivisionAncestors, getExpandableDivisionIds } from "../../lib/divisionTree"
import { useAppStore } from "../../store/useAppStore"
import DivisionEditDialog from "./DivisionEditDialog"

type AddChildFormProps = {
  depth: number
  parentName: string
  value: string
  isPending: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

const AddChildForm = ({
  depth,
  parentName,
  value,
  isPending,
  onChange,
  onSubmit,
  onCancel,
}: AddChildFormProps) => {
  const { t } = useTranslation()
  const canSubmit = value.trim().length > 0 && !isPending

  return (
    <div
      className="mb-1 px-2"
      style={{ paddingLeft: `${(depth + 1) * 8 + 8}px` }}
    >
      <p className="mb-1 text-[11px] text-ink-subtle">{t("divisions.createUnder", { name: parentName })}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSubmit) void onSubmit()
          if (e.key === "Escape") onCancel()
        }}
        placeholder={t("divisions.namePlaceholder")}
        className="w-full text-sm"
        autoFocus
        disabled={isPending}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit}
          className="btn-primary !px-3 !py-1.5 text-xs"
        >
          {t("divisions.createSubBrain")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  )
}

type TreeRowProps = {
  node: DivisionTreeNode
  focusDivisionId: string
  expandedIds: Set<string>
  addingUnderParentId: string | null
  newName: string
  isCreating: boolean
  inactiveLabel: string
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
  onEdit: (division: Division) => void
  onStartAddChild: (parentId: string) => void
  onViewNotes: (id: string) => void
  onNewNameChange: (name: string) => void
  onSubmitNew: () => void
  onCancelAdd: () => void
}

const TreeRow = ({
  node,
  focusDivisionId,
  expandedIds,
  addingUnderParentId,
  newName,
  isCreating,
  inactiveLabel,
  onToggleExpand,
  onSelect,
  onEdit,
  onStartAddChild,
  onViewNotes,
  onNewNameChange,
  onSubmitNew,
  onCancelAdd,
}: TreeRowProps) => {
  const { t } = useTranslation()
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isActive = focusDivisionId === node.id
  const isAddingHere = addingUnderParentId === node.id

  return (
    <>
      <div
        className={`group mb-0.5 flex items-center rounded-lg ${
          isActive ? "row-active" : "hover:bg-accent-soft/50 dark:hover:bg-charcoal"
        }`}
      >
        <div
          className="flex min-w-0 flex-1 items-center"
          style={{ paddingLeft: `${node.depth * 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node.id)}
              className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle hover:bg-paper dark:hover:bg-charcoal-elevated"
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? t("common.collapseSection", { title: node.name })
                  : t("common.expandSection", { title: node.name })
              }
            >
              {isExpanded ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
            </button>
          ) : (
            <span className="flex h-9 w-8 shrink-0 items-center justify-center">
              <span className="w-3" />
            </span>
          )}
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            className={`flex min-w-0 flex-1 items-center gap-1.5 py-2.5 pr-1 text-left text-sm md:py-2 ${
              isActive ? "font-medium text-accent dark:text-accent-muted" : "text-ink-muted"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            <BrainIcon size={14} className="shrink-0" />
            <span className="truncate">{node.name}</span>
            {!node.isActive && (
              <span className="shrink-0 text-[10px] uppercase text-ink-subtle">{inactiveLabel}</span>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() => onViewNotes(node.id)}
          className="rounded p-1 text-ink-subtle opacity-100 hover:bg-paper hover:text-ink-muted md:opacity-0 md:transition-opacity md:group-hover:opacity-100 dark:hover:bg-charcoal-elevated"
          aria-label={t("divisions.viewNotesFor", { name: node.name })}
          title={t("divisions.viewNotesFor", { name: node.name })}
        >
          <ListIcon size={12} />
        </button>
        <button
          type="button"
          onClick={() => onStartAddChild(node.id)}
          className="rounded p-1 text-ink-subtle opacity-100 hover:bg-paper hover:text-ink-muted md:opacity-0 md:transition-opacity md:group-hover:opacity-100 dark:hover:bg-charcoal-elevated"
          aria-label={t("divisions.addChildSubBrain", { name: node.name })}
          title={t("divisions.addChildSubBrain", { name: node.name })}
        >
          <PlusIcon size={12} />
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
      {isAddingHere && (
        <AddChildForm
          depth={node.depth}
          parentName={node.name}
          value={newName}
          isPending={isCreating}
          onChange={onNewNameChange}
          onSubmit={onSubmitNew}
          onCancel={onCancelAdd}
        />
      )}
      {hasChildren &&
        isExpanded &&
        node.children.map((child: DivisionTreeNode) => (
            <TreeRow
              key={child.id}
              node={child}
              focusDivisionId={focusDivisionId}
              expandedIds={expandedIds}
              addingUnderParentId={addingUnderParentId}
              newName={newName}
              isCreating={isCreating}
              inactiveLabel={inactiveLabel}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onEdit={onEdit}
              onStartAddChild={onStartAddChild}
              onViewNotes={onViewNotes}
              onNewNameChange={onNewNameChange}
              onSubmitNew={onSubmitNew}
              onCancelAdd={onCancelAdd}
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
  showHelp?: boolean
}

const DivisionTree = ({
  className = "",
  compact = false,
  collapsible = false,
  expanded = true,
  onToggle,
  showHelp = !compact,
}: DivisionTreeProps) => {
  const { t } = useTranslation()
  useBootstrapDivisionState()
  useBootstrapSubBrainsEnabled()
  const { tree, divisions, childrenMap } = useDivisionTree()
  const createDivision = useCreateDivision()
  const { focusDivisionId, focusDivision } = useFocusDivision()
  const setActivePane = useAppStore((s) => s.setActivePane)

  const divisionById = useMemo(() => new Map(divisions.map((d) => [d.id, d])), [divisions])
  const activeDivisionName = divisionById.get(focusDivisionId)?.name ?? ""

  const expandableIds = useMemo(
    () => getExpandableDivisionIds(divisions, childrenMap),
    [divisions, childrenMap],
  )

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [addingUnderParentId, setAddingUnderParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)

  useEffect(() => {
    if (divisions.length === 0) return
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev
      return new Set(expandableIds)
    })
  }, [divisions.length, expandableIds])

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

  const startAddChild = (parentId: string) => {
    setAddingUnderParentId(parentId)
    setNewName("")
    setExpandedIds((prev) => new Set([...prev, parentId]))
  }

  const cancelAdd = () => {
    setAddingUnderParentId(null)
    setNewName("")
  }

  const handleCreate = async () => {
    if (!addingUnderParentId) return
    const trimmed = newName.trim()
    if (!trimmed) return
    await createDivision.mutateAsync({
      parentId: addingUnderParentId,
      name: trimmed,
    })
    setExpandedIds((prev) => new Set([...prev, addingUnderParentId]))
    cancelAdd()
  }

  const viewNotes = (id: string) => {
    focusDivision(id)
    setActivePane("list")
  }

  const showBody = !collapsible || expanded
  const showLabeledCreate = showHelp && showBody

  const headerActions = showLabeledCreate ? (
    <button
      type="button"
      onClick={() => startAddChild(focusDivisionId)}
      className="btn-primary flex shrink-0 items-center gap-1.5 !px-3 !py-1.5 text-xs"
    >
      <PlusIcon size={14} />
      {t("divisions.newSubBrain")}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => startAddChild(focusDivisionId)}
      className="icon-btn !p-1.5"
      aria-label={t("divisions.newSubBrainUnder", { name: activeDivisionName })}
      title={t("divisions.newSubBrainUnder", { name: activeDivisionName })}
    >
      <PlusIcon size={16} />
    </button>
  )

  const sectionHeader = (
    <div className="surface-header flex items-center gap-2 px-3 py-2">
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

      {showBody && showHelp && (
        <>
          <p className="border-b border-border px-3 py-2.5 text-xs leading-relaxed text-ink-subtle dark:border-charcoal-border">
            {t("divisions.treeHelp")}
          </p>
          {activeDivisionName && (
            <div className="border-b border-border px-3 py-2.5 dark:border-charcoal-border">
              <button
                type="button"
                onClick={() => viewNotes(focusDivisionId)}
                className="btn-secondary flex w-full items-center justify-center gap-2 !px-3 !py-2 text-sm"
              >
                <ListIcon size={16} />
                {t("divisions.viewNotesFor", { name: activeDivisionName })}
              </button>
            </div>
          )}
        </>
      )}

      {showBody && (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
          {tree.map((node) => (
            <TreeRow
              key={node.id}
              node={node}
              focusDivisionId={focusDivisionId}
              expandedIds={expandedIds}
              addingUnderParentId={addingUnderParentId}
              newName={newName}
              isCreating={createDivision.isPending}
              inactiveLabel={t("divisions.inactiveBadge")}
              onToggleExpand={toggleExpand}
              onSelect={focusDivision}
              onEdit={setEditingDivision}
              onStartAddChild={startAddChild}
              onViewNotes={viewNotes}
              onNewNameChange={setNewName}
              onSubmitNew={() => void handleCreate()}
              onCancelAdd={cancelAdd}
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
