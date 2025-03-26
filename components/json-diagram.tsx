"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"

interface JsonDiagramProps {
  data: any
}

// Custom node types
const nodeTypes = {
  object: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{data.label}</div>
          {data.count !== undefined && <div className="text-xs text-gray-500">{`{${data.count}}`}</div>}
        </div>
      </div>
    </div>
  ),
  array: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{data.label}</div>
          {data.count !== undefined && (
            <div className="text-xs text-blue-600 dark:text-blue-400">{`[${data.count}]`}</div>
          )}
        </div>
      </div>
    </div>
  ),
  primitive: ({ data }: { data: any }) => (
    <div
      className={cn(
        "px-4 py-2 shadow-md rounded-md border",
        data.valueType === "string" && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        data.valueType === "number" && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        data.valueType === "boolean" && "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
        data.valueType === "null" && "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700",
      )}
    >
      <div className="flex flex-col">
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{data.label}</div>
        <div
          className={cn(
            "text-sm",
            data.valueType === "string" && "text-green-600 dark:text-green-400",
            data.valueType === "number" && "text-blue-600 dark:text-blue-400",
            data.valueType === "boolean" && "text-orange-600 dark:text-orange-400",
            data.valueType === "null" && "text-gray-500",
          )}
        >
          {data.value}
        </div>
      </div>
    </div>
  ),
}

export default function JsonDiagram({ data }: JsonDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Process JSON data to create nodes and edges
    const processJsonData = () => {
      setIsLoading(true)
      const { nodes, edges } = createNodesAndEdges(data)
      setNodes(nodes)
      setEdges(edges)
      setIsLoading(false)
    }

    processJsonData()
  }, [data, setNodes, setEdges])

  const createNodesAndEdges = (data: any) => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    let nodeId = 0

    // Helper function to create nodes and edges recursively
    const processObject = (obj: any, parentId: string | null = null, key = "root", x = 0, y = 0, level = 0): string => {
      const currentId = `node-${nodeId++}`

      if (obj === null) {
        // Handle null values
        nodes.push({
          id: currentId,
          type: "primitive",
          position: { x, y },
          data: { label: key, value: "null", valueType: "null" },
        })
      } else if (typeof obj !== "object") {
        // Handle primitive values
        const valueType = typeof obj
        const displayValue = typeof obj === "string" ? `"${obj}"` : String(obj)

        nodes.push({
          id: currentId,
          type: "primitive",
          position: { x, y },
          data: { label: key, value: displayValue, valueType },
        })
      } else if (Array.isArray(obj)) {
        // Handle arrays
        nodes.push({
          id: currentId,
          type: "array",
          position: { x, y },
          data: { label: key, count: obj.length },
        })

        // Process array items
        let childX = x
        let maxChildWidth = 0

        obj.forEach((item, index) => {
          const childId = processObject(item, currentId, `[${index}]`, childX, y + 150, level + 1)

          edges.push({
            id: `edge-${parentId}-${childId}`,
            source: currentId,
            target: childId,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
          })

          childX += 200 // Horizontal spacing between array items
          maxChildWidth = Math.max(maxChildWidth, 200)
        })
      } else {
        // Handle objects
        const keys = Object.keys(obj)

        nodes.push({
          id: currentId,
          type: "object",
          position: { x, y },
          data: { label: key, count: keys.length },
        })

        // Process object properties
        let childX = x - (keys.length * 100) / 2

        keys.forEach((key) => {
          const childId = processObject(obj[key], currentId, key, childX, y + 150, level + 1)

          edges.push({
            id: `edge-${currentId}-${childId}`,
            source: currentId,
            target: childId,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
          })

          childX += 200 // Horizontal spacing between object properties
        })
      }

      // Connect to parent if exists
      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
        })
      }

      return currentId
    }

    // Start processing from the root
    processObject(data)

    // Apply automatic layout
    const layoutNodes = nodes.map((node, index) => {
      const depth = node.id.split("-")[1] ? Number.parseInt(node.id.split("-")[1]) : 0
      return {
        ...node,
        position: {
          x: index * 250,
          y: depth * 150,
        },
      }
    })

    return { nodes: layoutNodes, edges }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

