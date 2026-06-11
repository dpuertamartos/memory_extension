import Placeholder from "@tiptap/extension-placeholder"
import { Markdown } from "@tiptap/markdown"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { useTranslation } from "react-i18next"
import { matchTagTrigger } from "../../lib/tagTrigger"
import EditorToolbar from "./EditorToolbar"

export type TagTriggerAnchor = { top: number; left: number }

export type MarkdownEditorHandle = {
  removeTagTrigger: () => void
}

type MarkdownEditorProps = {
  noteId: string
  content: string
  onChange: (markdown: string) => void
  onTagTrigger: (query: string, anchor: TagTriggerAnchor) => void
  onTagDismiss: () => void
}

type TriggerRange = { from: number; to: number; query: string }

function detectTagTriggerAtCursor(editor: Editor): TriggerRange | null {
  const { from, empty } = editor.state.selection
  if (!empty) return null

  const $from = editor.state.selection.$from
  const textBefore = editor.state.doc.textBetween($from.start(), from, "\n", "\0")
  const match = matchTagTrigger(textBefore)
  if (!match) return null

  return { from: from - match.length, to: from, query: match.query }
}

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  ({ noteId, content, onChange, onTagTrigger, onTagDismiss }, ref) => {
    const { t, i18n } = useTranslation()
    const containerRef = useRef<HTMLDivElement>(null)
    const skipNextSync = useRef(false)
    const triggerRangeRef = useRef<TriggerRange | null>(null)
    const onChangeRef = useRef(onChange)
    const onTagTriggerRef = useRef(onTagTrigger)
    const onTagDismissRef = useRef(onTagDismiss)

    onChangeRef.current = onChange
    onTagTriggerRef.current = onTagTrigger
    onTagDismissRef.current = onTagDismiss

    const editor = useEditor(
      {
        extensions: [
          StarterKit,
          Markdown,
          Placeholder.configure({
            placeholder: t("editor.placeholder"),
          }),
        ],
        content,
        contentType: "markdown",
        immediatelyRender: false,
        editorProps: {
          attributes: {
            class: "tiptap-editor",
          },
        },
        onUpdate: ({ editor: activeEditor }) => {
          const markdown = activeEditor.getMarkdown()
          skipNextSync.current = true
          onChangeRef.current(markdown)

          const trigger = detectTagTriggerAtCursor(activeEditor)
          if (!trigger || !containerRef.current) {
            triggerRangeRef.current = null
            onTagDismissRef.current()
            return
          }

          triggerRangeRef.current = trigger
          const coords = activeEditor.view.coordsAtPos(trigger.to)
          const containerRect = containerRef.current.getBoundingClientRect()
          onTagTriggerRef.current(trigger.query, {
            top: coords.bottom - containerRect.top + containerRef.current.scrollTop + 4,
            left: coords.left - containerRect.left,
          })
        },
      },
      [noteId, i18n.language, t],
    )

    useImperativeHandle(
      ref,
      () => ({
        removeTagTrigger: () => {
          if (!editor) return

          const range = triggerRangeRef.current
          if (!range) return

          editor.chain().focus().deleteRange({ from: range.from, to: range.to }).run()
          triggerRangeRef.current = null

          skipNextSync.current = true
          onChangeRef.current(editor.getMarkdown())
        },
      }),
      [editor],
    )

    useEffect(() => {
      if (!editor) return
      if (skipNextSync.current) {
        skipNextSync.current = false
        return
      }
      if (editor.getMarkdown() !== content) {
        editor.commands.setContent(content, { contentType: "markdown", emitUpdate: false })
      }
    }, [content, editor])

    return (
      <div ref={containerRef} className="relative flex min-h-[60vh] flex-col">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} className="flex-1 px-1 py-2" />
      </div>
    )
  },
)

MarkdownEditor.displayName = "MarkdownEditor"

export default MarkdownEditor
