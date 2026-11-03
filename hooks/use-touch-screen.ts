import * as React from "react"

// Whether the main way of pointing here is a finger. False while hydrating, like the server render, then the real answer.

export const isTouchScreen = () => window.matchMedia("(pointer: coarse)").matches

const noChange = () => () => {}

export function useTouchScreen() {
  return React.useSyncExternalStore(noChange, isTouchScreen, () => false)
}
