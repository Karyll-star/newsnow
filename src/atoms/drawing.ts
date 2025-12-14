import { atom } from "jotai"

interface Point {
  x: number
  y: number
}

export interface Line {
  points: Point[]
  color: string
}

export const drawingModeAtom = atom(false)
export const drawingColorAtom = atom("black")
export const linesAtom = atom<Line[]>([])
