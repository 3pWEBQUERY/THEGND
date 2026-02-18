"use client"

import React, { useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo2,
  Redo2,
  Eraser
} from "lucide-react"
import { cn } from "@/lib/utils"

export type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Hinweis: Dieser Editor ist bewusst ohne externe RTE-Bibliotheken gebaut (nur Browser-APIs & contenteditable)
export default function RichTextEditor({ value, onChange, placeholder, className, disabled }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  // InnerHTML synchronisieren, wenn value extern geändert wird
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || ""
    }
  }, [value])

  const isEmpty = useMemo(() => {
    if (!value) return true
    const text = stripHtml(value).trim()
    return text.length === 0
  }, [value])

  const apply = (command: string, value?: string) => {
    if (disabled) return
    // Fokus sicherstellen, damit Commands auf die Auswahl wirken
    editorRef.current?.focus()
    // execCommand ist deprecated, funktioniert aber weiterhin breit in Browsern
    document.execCommand(command, false, value)
  }

  const onInput = () => {
    const el = editorRef.current
    if (!el) return
    onChange(el.innerHTML)
  }

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Einfache Normalisierung beim Einfügen: nur reinen Text einfügen und Basisformatierung erlauben
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const setHeading = (tag: "h1" | "h2" | "p") => {
    apply("formatBlock", tag)
  }

  const createLink = () => {
    if (disabled) return
    const url = window.prompt("Link-URL eingeben (https://…)")
    if (!url) return
    apply("createLink", url)
  }

  const clearFormatting = () => apply("removeFormat")

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3 text-gray-700">
        <Button type="button" variant="outline" size="sm" onClick={() => apply("bold")} className="rounded-none" disabled={disabled}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("italic")} className="rounded-none" disabled={disabled}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("underline")} className="rounded-none" disabled={disabled}>
          <Underline className="h-4 w-4" />
        </Button>

        <div className="mx-1 w-px self-stretch bg-gray-200" />

        <Button type="button" variant="outline" size="sm" onClick={() => setHeading("h1")} className="rounded-none" disabled={disabled}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setHeading("h2")} className="rounded-none" disabled={disabled}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setHeading("p")} className="rounded-none text-xs">
          P
        </Button>

        <div className="mx-1 w-px self-stretch bg-gray-200" />

        <Button type="button" variant="outline" size="sm" onClick={() => apply("insertUnorderedList")} className="rounded-none" disabled={disabled}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("insertOrderedList")} className="rounded-none" disabled={disabled}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={createLink} className="rounded-none" disabled={disabled}>
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="mx-1 w-px self-stretch bg-gray-200" />

        <Button type="button" variant="outline" size="sm" onClick={() => apply("undo")} className="rounded-none" disabled={disabled}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("redo")} className="rounded-none" disabled={disabled}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearFormatting} className="rounded-none" disabled={disabled}>
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className={cn(
        "relative border-0 border-b-2 border-gray-200 rounded-none bg-transparent",
        disabled ? "opacity-60" : ""
      )}>
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-0 top-0 text-gray-400 text-sm py-3">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={onInput}
          onPaste={onPaste}
          className="min-h-[140px] text-sm font-light text-gray-800 focus:outline-none py-3"
        />
      </div>
    </div>
  )
}

function stripHtml(html: string) {
  const tmp = document.createElement("div")
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ""
}
