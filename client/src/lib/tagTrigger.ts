/** Match `#tag` being typed at end of a text prefix (cursor position). */
export function matchTagTrigger(textBeforeCursor: string): { query: string; length: number } | null {
  const match = textBeforeCursor.match(/#([^#\n]*)$/)
  if (!match) return null
  return { query: match[1], length: match[0].length }
}
