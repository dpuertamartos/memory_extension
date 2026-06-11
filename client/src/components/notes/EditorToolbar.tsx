import {
  CodeIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextBIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { Editor } from "@tiptap/react"

type EditorToolbarProps = {
  editor: Editor | null
}

const ToolbarButton = ({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`rounded-md p-1.5 text-ink-muted transition-colors hover:bg-paper dark:text-charcoal-muted dark:hover:bg-charcoal ${
      active ? "bg-accent-soft text-accent dark:bg-accent/20 dark:text-accent-muted" : ""
    }`}
  >
    {children}
  </button>
)

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const { t } = useTranslation()

  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5 dark:border-charcoal-border">
      <ToolbarButton
        label={t("editor.bold")}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextBIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.italic")}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalicIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.heading1")}
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <TextHOneIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.heading2")}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <TextHTwoIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.bulletList")}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBulletsIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.numberedList")}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbersIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.blockquote")}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuotesIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        label={t("editor.codeBlock")}
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <CodeIcon size={16} />
      </ToolbarButton>
    </div>
  )
}

export default EditorToolbar
