import type { Metadata } from "next"
import JsonGridViewer from "@/components/json-grid-viewer"

export const metadata: Metadata = {
  title: "JSON Grid Viewer",
  description: "A modern tool to visualize and manipulate JSON data in a grid format",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <JsonGridViewer />
    </main>
  )
}

