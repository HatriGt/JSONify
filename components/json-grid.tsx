"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Filter, Maximize2, Download, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

interface JsonGridProps {
  data: any
  searchTerm: string
  expandAll: boolean
  path?: string
  parentFilters?: Record<string, Record<string, string[]>>
  parentPath?: string
}

export default function JsonGrid({
  data,
  searchTerm,
  expandAll,
  path = "",
  parentFilters = {},
  parentPath = "",
}: JsonGridProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [columnFilters, setColumnFilters] = useState<Record<string, Record<string, string[]>>>({})
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [fullScreenData, setFullScreenData] = useState<{ data: any; key: string } | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [currentFilterColumn, setCurrentFilterColumn] = useState<string | null>(null)
  const [currentFilterPath, setCurrentFilterPath] = useState<string>("")
  const [distinctValues, setDistinctValues] = useState<any[]>([])

  // Initialize expanded state based on expandAll prop
  useEffect(() => {
    if (expandAll) {
      const newExpandedItems: Record<string, boolean> = {}
      const expandAllItems = (obj: any, currentPath = "") => {
        if (typeof obj !== "object" || obj === null) return

        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            const itemPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`
            newExpandedItems[itemPath] = true
            expandAllItems(item, itemPath)
          })
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            const itemPath = currentPath ? `${currentPath}.${key}` : key
            newExpandedItems[itemPath] = true
            expandAllItems(value, itemPath)
          })
        }
      }

      expandAllItems(data)
      setExpandedItems(newExpandedItems)
    } else {
      setExpandedItems({})
    }
  }, [expandAll, data])

  const isExpanded = (key: string) => {
    const fullPath = path ? `${path}.${key}` : key
    return expandedItems[fullPath]
  }

  const toggleExpand = (key: string) => {
    const fullPath = path ? `${path}.${key}` : key
    setExpandedItems((prev) => ({
      ...prev,
      [fullPath]: !prev[fullPath],
    }))
  }

  const isMatch = (value: any, term: string) => {
    if (!term) return false

    const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value)

    return stringValue.toLowerCase().includes(term.toLowerCase())
  }

  const openFullScreen = (data: any, key: string) => {
    setFullScreenData({ data, key })
    setIsFullScreen(true)
  }

  const handleResizeStart = (column: string, initialWidth: number, e: React.MouseEvent) => {
    setResizingColumn(column)
    setStartX(e.clientX)
    setStartWidth(initialWidth)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (resizingColumn) {
        const diff = moveEvent.clientX - startX
        const newWidth = Math.max(100, startWidth + diff) // Minimum width of 100px

        setColumnWidths((prev) => ({
          ...prev,
          [column]: newWidth,
        }))
      }
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const exportToExcel = (array: any[], key: string) => {
    try {
      // Get all possible columns from all array items
      const columns = Array.from(new Set(array.flatMap((item) => Object.keys(item))))

      // Create CSV content
      let csvContent = columns.join(",") + "\n"

      array.forEach((item) => {
        const row = columns.map((column) => {
          const value = item[column]
          if (value === undefined || value === null) return ""
          if (typeof value === "object") return JSON.stringify(value).replace(/,/g, ";")
          return String(value).replace(/,/g, ";")
        })
        csvContent += row.join(",") + "\n"
      })

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${key}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `${key} has been exported to CSV`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to CSV",
        variant: "destructive",
      })
    }
  }

  const renderPrimitiveValue = (value: any, matched = false) => {
    if (value === null) {
      return <span className="text-gray-500 italic">null</span>
    }

    if (value === undefined) {
      return <span className="text-gray-500 italic">undefined</span>
    }

    if (typeof value === "boolean") {
      return <span className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{String(value)}</span>
    }

    if (typeof value === "number") {
      return <span className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{value}</span>
    }

    if (typeof value === "string") {
      return (
        <span className={cn("bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded", matched && "ring-2 ring-yellow-400")}>
          {`"${value}"`}
        </span>
      )
    }

    return <span>{String(value)}</span>
  }

  const renderObject = (obj: Record<string, any>, key: string) => {
    const fullPath = path ? `${path}.${key}` : key
    const matched = isMatch(obj, searchTerm)

    return (
      <div className="border rounded-md overflow-hidden">
        <div
          className={cn(
            "flex items-center justify-between p-3 bg-white dark:bg-gray-800 cursor-pointer",
            matched && "bg-yellow-50 dark:bg-yellow-900/20",
          )}
          onClick={() => toggleExpand(key)}
        >
          <div className="flex items-center">
            {isExpanded(key) ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
            <span className="font-medium">{key}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
              Object
            </Badge>
            <span className="text-xs text-gray-500">{Object.keys(obj).length} properties</span>
          </div>
        </div>

        {isExpanded(key) && (
          <div className="pl-6 border-l border-gray-200 dark:border-gray-700 ml-3 mt-2 mb-2">
            {Object.entries(obj).map(([objKey, objValue]) => (
              <div key={objKey} className="mb-2">
                {typeof objValue === "object" && objValue !== null ? (
                  renderValue(objValue, objKey)
                ) : (
                  <div className="flex items-start">
                    <span className="font-medium mr-2">{objKey}:</span>
                    {renderPrimitiveValue(objValue, isMatch(objValue, searchTerm))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getDistinctValues = (array: any[], column: string) => {
    const values = array
      .map((item) => item[column])
      .filter(
        (value, index, self) =>
          value !== undefined && self.findIndex((v) => JSON.stringify(v) === JSON.stringify(value)) === index,
      )

    return values
  }

  const applyFilters = (array: any[], filters: Record<string, string[]>, currentPath: string) => {
    if (!filters || Object.keys(filters).length === 0) return array

    return array.filter((item) => {
      return Object.entries(filters).every(([column, selectedValues]) => {
        if (selectedValues.length === 0) return true

        const value = item[column]
        if (value === undefined) return false

        // For primitive values, check if the value is in the selected values
        if (typeof value !== "object" || value === null) {
          return selectedValues.includes(String(value))
        }

        // For objects, check if the stringified value is in the selected values
        return selectedValues.includes(JSON.stringify(value))
      })
    })
  }

  const openFilterDialog = (column: string, array: any[], currentPath: string) => {
    setCurrentFilterColumn(column)
    setCurrentFilterPath(currentPath)
    setDistinctValues(getDistinctValues(array, column))
    setFilterDialogOpen(true)
  }

  const renderArray = (array: any[], key: string) => {
    const fullPath = path ? `${path}.${key}` : key
    const matched = isMatch(array, searchTerm)

    // Skip empty arrays
    if (array.length === 0) {
      return (
        <div className="border rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800">
            <div className="flex items-center">
              <span className="font-medium">{key}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                Array
              </Badge>
              <span className="text-xs text-gray-500">Empty</span>
            </div>
          </div>
        </div>
      )
    }

    // Check if array contains objects with consistent properties
    const isObjectArray = array.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))

    if (isObjectArray) {
      // Get all possible columns from all array items
      const columns = Array.from(new Set(array.flatMap((item) => Object.keys(item))))

      // Get filters for this specific array path
      const currentFilters = columnFilters[fullPath] || {}

      // Apply filters
      const filteredArray = applyFilters(array, currentFilters, fullPath)

      return (
        <div className="border rounded-md overflow-hidden">
          <div
            className={cn(
              "flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 cursor-pointer",
              matched && "bg-yellow-50 dark:bg-yellow-900/20",
            )}
            onClick={() => toggleExpand(key)}
          >
            <div className="flex items-center">
              {isExpanded(key) ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              <span className="font-medium">{key}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                Array
              </Badge>
              <span className="text-xs text-gray-500">{array.length} items</span>
              {currentFilters && Object.keys(currentFilters).length > 0 && (
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                  Filtered
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        exportToExcel(array, key)
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export to CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        openFullScreen(array, key)
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View in full screen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {isExpanded(key) && (
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 p-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-b">
                      #
                    </th>
                    {columns.map((column) => {
                      const columnWidth = columnWidths[column] || 200

                      return (
                        <th
                          key={column}
                          className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 p-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-b"
                          style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">{column}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openFilterDialog(column, array, fullPath)
                                }}
                              >
                                <Filter className="h-3 w-3" />
                              </Button>
                            </div>
                            <div
                              className="w-1 h-full cursor-col-resize opacity-0 hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => handleResizeStart(column, columnWidth, e)}
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredArray.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-4 text-center text-gray-500">
                        No results match your filters
                      </td>
                    </tr>
                  ) : (
                    filteredArray.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="p-2 text-sm text-gray-500">{index}</td>
                        {columns.map((column) => {
                          const columnWidth = columnWidths[column] || 200

                          return (
                            <td
                              key={column}
                              className="p-2"
                              style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                            >
                              {item[column] !== undefined ? (
                                typeof item[column] === "object" && item[column] !== null ? (
                                  <JsonGrid
                                    data={item[column]}
                                    searchTerm={searchTerm}
                                    expandAll={expandAll}
                                    path={`${fullPath}[${index}].${column}`}
                                    parentFilters={columnFilters}
                                    parentPath={fullPath}
                                  />
                                ) : (
                                  renderPrimitiveValue(item[column], isMatch(item[column], searchTerm))
                                )
                              ) : (
                                <span className="text-gray-400 text-xs italic">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    } else {
      // Render as a regular array
      return (
        <div className="border rounded-md overflow-hidden">
          <div
            className={cn(
              "flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 cursor-pointer",
              matched && "bg-yellow-50 dark:bg-yellow-900/20",
            )}
            onClick={() => toggleExpand(key)}
          >
            <div className="flex items-center">
              {isExpanded(key) ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              <span className="font-medium">{key}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                Array
              </Badge>
              <span className="text-xs text-gray-500">{array.length} items</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        openFullScreen(array, key)
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View in full screen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {isExpanded(key) && (
            <div className="pl-6 border-l border-gray-200 dark:border-gray-700 ml-3 mt-2 mb-2">
              {array.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex items-start">
                    <span className="font-medium mr-2">{index}:</span>
                    {typeof item === "object" && item !== null ? (
                      <JsonGrid
                        data={item}
                        searchTerm={searchTerm}
                        expandAll={expandAll}
                        path={`${fullPath}[${index}]`}
                        parentFilters={columnFilters}
                        parentPath={fullPath}
                      />
                    ) : (
                      renderPrimitiveValue(item, isMatch(item, searchTerm))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  }

  const renderValue = (value: any, key: string) => {
    if (value === null || value === undefined || typeof value !== "object") {
      return (
        <div className="flex items-start mb-2">
          <span className="font-medium mr-2">{key}:</span>
          {renderPrimitiveValue(value, isMatch(value, searchTerm))}
        </div>
      )
    }

    if (Array.isArray(value)) {
      return renderArray(value, key)
    }

    return renderObject(value, key)
  }

  const renderFullScreenContent = () => {
    if (!fullScreenData) return null

    return (
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{fullScreenData.key}</span>
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700">
                {Array.isArray(fullScreenData.data) ? "Array" : "Object"}
              </Badge>
              {Array.isArray(fullScreenData.data) && (
                <span className="text-xs text-gray-500">{fullScreenData.data.length} items</span>
              )}
              {Array.isArray(fullScreenData.data) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => exportToExcel(fullScreenData.data, fullScreenData.key)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto h-full p-4">
            <JsonGrid
              data={fullScreenData.data}
              searchTerm={searchTerm}
              expandAll={true}
              path={fullScreenData.key}
              parentFilters={columnFilters}
              parentPath={path}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Filter dialog
  const renderFilterDialog = () => {
    if (!currentFilterColumn) return null

    return (
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by {currentFilterColumn}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto py-2">
            {distinctValues.map((value, index) => {
              const stringValue = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)

              const isSelected = columnFilters[currentFilterPath]?.[currentFilterColumn]?.includes(stringValue) || false

              return (
                <div key={index} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`${currentFilterColumn}-${index}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      setColumnFilters((prev) => {
                        const pathFilters = prev[currentFilterPath] || {}
                        const current = pathFilters[currentFilterColumn] || []
                        const updated = checked ? [...current, stringValue] : current.filter((v) => v !== stringValue)

                        return {
                          ...prev,
                          [currentFilterPath]: {
                            ...pathFilters,
                            [currentFilterColumn]: updated,
                          },
                        }
                      })
                    }}
                  />
                  <Label htmlFor={`${currentFilterColumn}-${index}`} className="text-sm truncate">
                    {typeof value === "object" && value !== null
                      ? JSON.stringify(value).substring(0, 20) + "..."
                      : String(value)}
                  </Label>
                </div>
              )
            })}
          </div>
          <Separator />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setColumnFilters((prev) => {
                  const newFilters = { ...prev }
                  if (newFilters[currentFilterPath]) {
                    const pathFilters = { ...newFilters[currentFilterPath] }
                    delete pathFilters[currentFilterColumn]
                    newFilters[currentFilterPath] = pathFilters
                  }
                  return newFilters
                })
                setFilterDialogOpen(false)
              }}
            >
              Clear filter
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (typeof data !== "object" || data === null) {
    return renderPrimitiveValue(data, isMatch(data, searchTerm))
  }

  if (Array.isArray(data)) {
    return (
      <>
        {renderArray(data, path || "root")}
        {renderFullScreenContent()}
        {renderFilterDialog()}
      </>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>{renderValue(value, key)}</div>
        ))}
        {renderFullScreenContent()}
        {renderFilterDialog()}
      </div>
    </TooltipProvider>
  )
}

