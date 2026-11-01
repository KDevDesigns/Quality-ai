import * as React from "react"

// Whether a phone's on-screen keyboard is open: the visual viewport shrinks well below the window when it is. Used to
// tuck the bottom tab bar away so the keyboard and the field being typed in have the room.

const KEYBOARD_PX = 150

function subscribe(onChange: () => void) {
  const vv = window.visualViewport
  if (!vv) return () => {}
  vv.addEventListener("resize", onChange)
  return () => vv.removeEventListener("resize", onChange)
}

function snapshot() {
  const vv = window.visualViewport
  // Pinch zoom shrinks the visual viewport too; scaling it back leaves only what the keyboard takes.
  return !!vv && window.innerHeight - vv.height * vv.scale > KEYBOARD_PX
}

export function useKeyboardOpen() {
  return React.useSyncExternalStore(subscribe, snapshot, () => false)
}
