"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Check,
  Code,
  Copy,
  Download,
  Grid,
  Search,
  Share2,
  Upload,
  X,
  FileJson,
  Indent,
  AlignJustify,
  MapIcon as Diagram,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import JsonEditor from "./json-editor"
import JsonGrid from "./json-grid"
import JsonDiagram from "./json-diagram"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const shoppingJson = `{
    "Shop": {
        "name": "SuperMart",
        "location": "City Center",
        "departments": [
            {
                "name": "Grocery",
                "categories": [
                    {
                        "name": "Fruits",
                        "items": [
                            {
                                "name": "Apple",
                                "price": 2.5
                            },
                            {
                                "name": "Banana",
                                "price": 1.0
                            }
                        ]
                    },
                    {
                        "name": "Vegetables",
                        "items": [
                            {
                                "name": "Carrot",
                                "price": 1.5
                            },
                            {
                                "name": "Tomato",
                                "price": 1.0
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Electronics",
                "categories": [
                    {
                        "name": "Smartphones",
                        "items": [
                            {
                                "name": "iPhone 13",
                                "price": 999.99
                            },
                            {
                                "name": "Samsung Galaxy S22",
                                "price": 899.99
                            }
                        ]
                    },
                    {
                        "name": "Laptops",
                        "items": [
                            {
                                "name": "MacBook Pro",
                                "price": 1499.99
                            },
                            {
                                "name": "Dell XPS 15",
                                "price": 1299.99
                            }
                        ]
                    }
                ]
            }
        ]
    }
}`

export default function JsonGridViewer() {
  const [jsonInput, setJsonInput] = useState(shoppingJson)
  const [parsedJson, setParsedJson] = useState<any>(null)
  const [isValid, setIsValid] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("json")
  const [expandAll, setExpandAll] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [jsonPath, setJsonPath] = useState("")
  const [jsonPathResult, setJsonPathResult] = useState<any>(null)
  const { theme, setTheme } = useTheme()
  const editorRef = useRef<any>(null)

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      setParsedJson(parsed)
      setIsValid(true)
      setErrorMessage("")
    } catch (error) {
      setIsValid(false)
      setErrorMessage((error as Error).message)
    }
  }, [jsonInput])

  const handleFormat = () => {
    if (isValid) {
      setJsonInput(JSON.stringify(parsedJson, null, 2))
      toast({
        title: "JSON beautified",
        description: "Your JSON has been prettified",
      })
    }
  }

  const handleMinify = () => {
    if (isValid) {
      setJsonInput(JSON.stringify(parsedJson))
      toast({
        title: "JSON minified",
        description: "Your JSON has been minified",
      })
    }
  }

  const handleClear = () => {
    setJsonInput(shoppingJson)
    toast({
      title: "Sample JSON loaded",
      description: "Default sample JSON has been loaded",
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonInput)
    toast({
      title: "Copied to clipboard",
      description: "JSON content copied to clipboard",
    })
  }

  const handleSample = () => {
    setJsonInput(shoppingJson)
    toast({
      title: "Sample loaded",
      description: "Sample JSON has been loaded",
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonInput(content)
      toast({
        title: "File loaded",
        description: `${file.name} has been loaded successfully`,
      })
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    if (!isValid) return

    const blob = new Blob([jsonInput], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "JSON downloaded",
      description: "Your JSON has been downloaded as data.json",
    })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleFetchUrl = async (url: string) => {
    try {
      const response = await fetch(url)
      const data = await response.json()
      setJsonInput(JSON.stringify(data, null, 2))
      toast({
        title: "JSON fetched",
        description: `Successfully loaded JSON from ${url}`,
      })
    } catch (error) {
      toast({
        title: "Error fetching JSON",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  // Toggle fold on initial load
  useEffect(() => {
    if (editorRef.current && activeTab === "json") {
      setTimeout(() => {
        editorRef.current.toggleFold()
      }, 300)
    }
  }, [activeTab])

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <FileJson className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">JSON Grid Viewer</h1>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Input type="file" id="file-upload" className="hidden" accept=".json" onChange={handleFileUpload} />
                  <Button variant="outline" size="icon" onClick={() => document.getElementById("file-upload")?.click()}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload JSON file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Display Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowLineNumbers(!showLineNumbers)}>
                {showLineNumbers ? "Hide line numbers" : "Show line numbers"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExpandAll(!expandAll)}>
                {expandAll ? "Collapse all nodes" : "Expand all nodes"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Fetch JSON from URL</DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fetch JSON from URL</DialogTitle>
                    <DialogDescription>Enter a URL to fetch JSON data from an API endpoint</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="url">URL</Label>
                      <Input id="url" placeholder="https://api.example.com/data.json" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        const url = (document.getElementById("url") as HTMLInputElement).value
                        if (url) handleFetchUrl(url)
                      }}
                    >
                      Fetch
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </header>

      <div className="mt-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Badge variant={isValid ? "success" : "destructive"} className="px-2 py-1">
              {isValid ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Valid JSON
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Invalid JSON
                </span>
              )}
            </Badge>
            {!isValid && <span className="text-sm text-destructive">{errorMessage}</span>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSample}>
              Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleFormat} disabled={!isValid}>
              <Indent className="h-4 w-4 mr-1" />
              Beautify
            </Button>
            <Button variant="outline" size="sm" onClick={handleMinify} disabled={!isValid}>
              <AlignJustify className="h-4 w-4 mr-1" />
              Minify
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>

        <Tabs defaultValue="json" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-4 border-b">
            <TabsList className="h-10">
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                GRID
              </TabsTrigger>
              <TabsTrigger value="diagram" className="flex items-center gap-2">
                <Diagram className="h-4 w-4" />
                DIAGRAM
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === "grid" && (
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in JSON..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
              {activeTab === "json" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.toggleFold()
                    }
                  }}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Toggle Fold
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="json" className="p-0 m-0">
            <div className="h-[calc(100vh-280px)] min-h-[400px]">
              <JsonEditor
                value={jsonInput}
                onChange={setJsonInput}
                isValid={isValid}
                showLineNumbers={showLineNumbers}
                ref={editorRef}
              />
            </div>
          </TabsContent>

          <TabsContent value="grid" className="p-0 m-0">
            <div className="h-[calc(100vh-280px)] min-h-[400px] overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
              {isValid && parsedJson ? (
                <JsonGrid data={parsedJson} searchTerm={searchTerm} expandAll={expandAll} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center p-8 border rounded-lg bg-white dark:bg-gray-800">
                    <X className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Invalid JSON</h3>
                    <p className="text-muted-foreground mt-2">Fix the JSON in the editor to view it in grid format</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="diagram" className="p-0 m-0">
            <div className="h-[calc(100vh-280px)] min-h-[400px] overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
              {isValid && parsedJson ? (
                <JsonDiagram data={parsedJson} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center p-8 border rounded-lg bg-white dark:bg-gray-800">
                    <X className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Invalid JSON</h3>
                    <p className="text-muted-foreground mt-2">Fix the JSON in the editor to view the diagram</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

