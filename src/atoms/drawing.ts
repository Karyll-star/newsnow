import { atom } from "jotai"

interface Point {
  x: number
  y: number
}

export type Line = Point[]

export const drawingModeAtom = atom(false)
export const linesAtom = atom<Line[]>([])
