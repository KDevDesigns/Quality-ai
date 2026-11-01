"use client"

import * as React from "react"
import { cn } from "cn"

// The handle at the top of a bottom sheet. Drag it down past a short distance to close the sheet (it presses the
// sheet's own close button, so the dialog closes the normal way); let go sooner and it springs back. The close button,
// Esc and a tap outside still work, so the drag is never the only way.

const CLOSE_PX = 80

export function Grabber({ className }: { className?: string }) {
  const start = React.useRef<number | null>(null)

  function sheet(el: Element) {
    return el.closest<HTMLElement>("[data-slot=dialog-content],[data-slot=sheet-content]")
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const s = sheet(e.currentTarget)
    if (!s?.querySelector("[data-slot$=-close]")) return
    start.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
    s.style.transition = "none"
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (start.current === null) return
    const s = sheet(e.currentTarget)
    if (s) s.style.translate = `0 ${Math.max(0, e.clientY - start.current)}px`
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (start.current === null) return
    const moved = e.clientY - start.current
    start.current = null
    const s = sheet(e.currentTarget)
    if (!s) return
    s.style.transition = ""
    s.style.translate = ""
    if (moved > CLOSE_PX) s.querySelector<HTMLElement>("[data-slot$=-close]")?.click()
  }

  return (
    <div
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn("absolute inset-x-0 top-0 flex h-6 cursor-grab touch-none justify-center pt-2 active:cursor-grabbing", className)}
    >
      <span className="h-[0.3125rem] w-10 rounded-full bg-line" />
    </div>
  )
}
