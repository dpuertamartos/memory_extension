import Placeholder from "@tiptap/extension-placeholder"
import { Markdown } from "@tiptap/markdown"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useRef } from "react"
import EditorToolbar from "./EditorToolbar"

export type TagTriggerAnchor = { top: number; left: number }

type MarkdownEditorProps = {
  noteId: string
  content: string
  onChange: (markdown: string) => void
  onTagTrigger: (query: string, anchor: TagTriggerAnchor) => void
  onTagDismiss: () => void
}

const detectTagTrigger = (
  markdown: string,
): { query: string } | null => {
  const hashIndex = markdown.lastIndexOf("#")
  if (hashIndex === -1) return null

  const afterHash = markdown.slice(hashIndex + 1)
  if (afterHash.includes(" ") || afterHash.includes("\n")) return null

  return { query: afterHash }
}

const MarkdownEditor = ({
  noteId,
  content,
  onChange,
  onTagTrigger,
  onTagDismiss,
}: MarkdownEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const skipNextSync = useRef(false)
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
          placeholder: "Write… Type # to add tags",
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

        const trigger = detectTagTrigger(markdown)
        if (!trigger || !containerRef.current) {
          onTagDismissRef.current()
          return
        }

        const coords = activeEditor.view.coordsAtPos(activeEditor.state.selection.from)
        const containerRect = containerRef.current.getBoundingClientRect()
        onTagTriggerRef.current(trigger.query, {
          top: coords.bottom - containerRect.top + containerRef.current.scrollTop + 4,
          left: coords.left - containerRect.left,
        })
      },
    },
    [noteId],
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
}

export default MarkdownEditor
