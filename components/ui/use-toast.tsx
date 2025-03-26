"use client"

// This is a simplified version of the toast component
// In a real app, you would use the full shadcn/ui toast component

import { useState, useEffect } from "react"

type ToastProps = {
  title: string
  description?: string
  duration?: number
}

type ToastState = ToastProps & {
  id: string
}

let toasts: ToastState[] = []
let listeners: Function[] = []

export function toast(props: ToastProps) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { ...props, id }

  toasts = [...toasts, newToast]
  listeners.forEach((listener) => listener(toasts))

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    listeners.forEach((listener) => listener(toasts))
  }, props.duration || 3000)

  return {
    id,
    dismiss: () => {
      toasts = toasts.filter((t) => t.id !== id)
      listeners.forEach((listener) => listener(toasts))
    },
  }
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<ToastState[]>(toasts)

  useEffect(() => {
    listeners.push(setCurrentToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setCurrentToasts)
    }
  }, [])

  return {
    toast,
    toasts: currentToasts,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id)
      listeners.forEach((listener) => listener(toasts))
    },
  }
}

