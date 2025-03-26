"use client"

import type React from "react"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import { cn } from "@/lib/utils"

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  isValid: boolean
  showLineNumbers?: boolean
}

interface FoldableSection {
  start: number
  end: number
  level: number
  folded: boolean
  type: "object" | "array"
  count?: number
}

const JsonEditor = forwardRef(({ value, onChange, isValid, showLineNumbers = true }: JsonEditorProps, ref) => {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [foldableSections, setFoldableSections] = useState<FoldableSection[]>([])
  const [foldedLines, setFoldedLines] = useState<Set<number>>(new Set())
  const [visibleValue, setVisibleValue] = useState(value)

  useImperativeHandle(ref, () => ({
    toggleFold: () => {
      // Toggle all top-level folds
      const topLevel = foldableSections.filter((section) => section.level === 1)
      const allFolded = topLevel.every((section) => section.folded)

      const newFoldableSections = foldableSections.map((section) => {
        if (section.level === 1) {
          return { ...section, folded: !allFolded }
        }
        return section
      })

      setFoldableSections(newFoldableSections)
      updateFoldedLines(newFoldableSections)
    },
  }))

  useEffect(() => {
    if (isValid) {
      detectFoldableSections()
    }
  }, [value, isValid])

  useEffect(() => {
    if (showLineNumbers && editorRef.current && lineNumbersRef.current) {
      updateLineNumbers()

      // Sync scrolling
      const syncScroll = () => {
        if (lineNumbersRef.current && editorRef.current) {
          lineNumbersRef.current.scrollTop = editorRef.current.scrollTop
        }
      }

      editorRef.current.addEventListener("scroll", syncScroll)
      return () => {
        editorRef.current?.removeEventListener("scroll", syncScroll)
      }
    }
  }, [value, showLineNumbers, foldedLines])

  useEffect(() => {
    // Update the visible value when folded lines change
    if (foldedLines.size > 0) {
      const lines = value.split("\n")
      const visibleLines = lines.filter((_, i) => !foldedLines.has(i))
      setVisibleValue(visibleLines.join("\n"))
    } else {
      setVisibleValue(value)
    }
  }, [value, foldedLines])

  const detectFoldableSections = () => {
    try {
      const lines = value.split("\n")
      const sections: FoldableSection[] = []
      const stack: { line: number; level: number; type: "object" | "array" }[] = []

      let level = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line.endsWith("{")) {
          level++
          stack.push({ line: i, level, type: "object" })
        } else if (line.endsWith("[")) {
          level++
          stack.push({ line: i, level, type: "array" })
        } else if (line.startsWith("}") || line.startsWith("]")) {
          if (stack.length > 0) {
            const start = stack.pop()
            if (start) {
              // Count items for arrays
              let count = undefined
              if (start.type === "array") {
                // Count the number of commas between start and end
                const arrayContent = lines.slice(start.line + 1, i).join("\n")
                const commaCount = (arrayContent.match(/,/g) || []).length
                count = commaCount + 1

                // If the array is empty, set count to 0
                if (arrayContent.trim() === "") {
                  count = 0
                }
              }

              sections.push({
                start: start.line,
                end: i,
                level: start.level,
                folded: false,
                type: start.type,
                count,
              })
            }
          }
          level = Math.max(0, level - 1)
        }
      }

      setFoldableSections(sections)
    } catch (error) {
      console.error("Error detecting foldable sections:", error)
    }
  }

  const updateFoldedLines = (sections: FoldableSection[]) => {
    const folded = new Set<number>()

    sections.forEach((section) => {
      if (section.folded) {
        for (let i = section.start + 1; i < section.end; i++) {
          folded.add(i)
        }
      }
    })

    setFoldedLines(folded)
  }

  const toggleFold = (sectionIndex: number) => {
    const newSections = [...foldableSections]
    newSections[sectionIndex].folded = !newSections[sectionIndex].folded

    setFoldableSections(newSections)
    updateFoldedLines(newSections)
  }

  const updateLineNumbers = () => {
    if (!lineNumbersRef.current) return

    const lines = value.split("\n")

    let html = ""

    for (let i = 0; i < lines.length; i++) {
      if (!foldedLines.has(i)) {
        const section = foldableSections.find((s) => s.start === i)

        if (section) {
          const countBadge =
            section.type === "array" && section.count !== undefined
              ? `<span class="text-xs text-blue-500 ml-1">[${section.count}]</span>`
              : ""

          html += `<div class="flex items-center">
            <button class="fold-button mr-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 w-6 h-6 flex items-center justify-center rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" data-index="${foldableSections.indexOf(section)}">
              ${
                section.folded
                  ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>'
                  : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path></svg>'
              }
            </button>
            <div class="text-right pr-2 text-gray-500 text-xs select-none">${i + 1}</div>
            ${countBadge}
          </div>`
        } else {
          html += `<div class="flex items-center">
            <div class="w-6 mr-1"></div>
            <div class="text-right pr-2 text-gray-500 text-xs select-none">${i + 1}</div>
          </div>`
        }
      }
    }

    lineNumbersRef.current.innerHTML = html

    // Add event listeners to fold buttons
    const buttons = lineNumbersRef.current.querySelectorAll(".fold-button")
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation()
        const index = Number.parseInt((button as HTMLElement).dataset.index || "0", 10)
        toggleFold(index)
      })
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // When editing, unfold everything
    setFoldableSections(foldableSections.map((section) => ({ ...section, folded: false })))
    setFoldedLines(new Set())
    onChange(e.target.value)
  }

  return (
    <div className="relative h-full w-full flex bg-white dark:bg-gray-800">
      {showLineNumbers && (
        <div
          ref={lineNumbersRef}
          className="w-20 bg-gray-50 dark:bg-gray-900 overflow-hidden h-full py-4 flex-shrink-0 border-r flex flex-col"
        />
      )}
      <textarea
        ref={editorRef}
        value={foldedLines.size > 0 ? visibleValue : value}
        onChange={handleChange}
        className={cn(
          "h-full w-full resize-none font-mono text-sm p-4 focus:outline-none focus:ring-0 border-0",
          !isValid && "bg-red-50 dark:bg-red-900/10",
        )}
        spellCheck="false"
        data-gramm="false"
      />
    </div>
  )
})

JsonEditor.displayName = "JsonEditor"

export default JsonEditor

