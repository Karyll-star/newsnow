import type { SourceID, SourceResponse } from "@shared/types"
import pinyin from "@shared/pinyin.json"
import { useMemo, useRef, useState } from "react"
import { sources } from "@shared/sources"
import { columns } from "@shared/metadata"
import { typeSafeObjectEntries } from "@shared/type.util"
import { clsx as $ } from "clsx"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import type { ReactZoomPanPinchRef, ReactZoomPanPinchState } from "react-zoom-pan-pinch"
import { myFetch } from "~/utils"
import { activeCardAtom } from "~/atoms/focus"
import { type Line, drawingColorAtom, drawingModeAtom, linesAtom } from "~/atoms/drawing"

// --- Helper Functions & Components ---

function getRandomRotation(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const rotate = (hash % 4) - 2
  return { transform: `rotate(${rotate}deg)` }
}

function BrushTools() {
  const [isDrawing, setIsDrawing] = useAtom(drawingModeAtom)
  const [color, setColor] = useAtom(drawingColorAtom)
  const [isPaletteOpen, setPaletteOpen] = useState(false)
  const colors = ["black", "red", "green", "orange", "yellow"]

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, moved: false })

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow dragging on the main button container, not the palette buttons
    if ((e.target as HTMLElement).closest("button")) return

    dragInfo.current = {
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current.isDragging) return
    dragInfo.current.moved = true
    setPosition({
      x: e.clientX - dragInfo.current.startX,
      y: e.clientY - dragInfo.current.startY,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragInfo.current.isDragging) return
    dragInfo.current.isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    setTimeout(() => {
      dragInfo.current.moved = false
    }, 0)
  }

  const handleBrushClick = () => {
    if (dragInfo.current.moved) return
    setIsDrawing(!isDrawing)
  }

  return (
    <div
      className={`absolute bottom-4 right-4 z-50 flex items-center gap-2 p-2 rounded-lg shadow-lg bg-white/60 backdrop-blur-md ${dragInfo.current.isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex flex-col gap-2">
        {isPaletteOpen && (
          <div className="flex flex-col items-center gap-2 p-1 rounded-md bg-black/10">
            {colors.map(c => (
              <button
                key={c}
                type="button"
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? "border-blue-500 scale-110" : "border-transparent hover:scale-110"}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setPaletteOpen(!isPaletteOpen)}
          className="p-1 text-black/50 hover:text-black cursor-pointer"
        >
          <svg className={`w-4 h-4 transition-transform ${isPaletteOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <button
        type="button"
        onClick={handleBrushClick}
        className={$(
          "p-2 rounded-lg shadow-md text-2xl transition-colors cursor-pointer",
          isDrawing ? "bg-red-500 text-white" : "bg-white text-black",
        )}
        title="Toggle Drawing Mode"
      >
        🖌️
      </button>
    </div>
  )
}

function DrawingCanvas() {
  const [isDrawingMode] = useAtom(drawingModeAtom)
  const [lines, setLines] = useAtom(linesAtom)
  const [color] = useAtom(drawingColorAtom)
  const [currentLine, setCurrentLine] = useState<Line | null>(null)

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setCurrentLine({ points: [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }], color })
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons !== 1 || !currentLine) return
    const newPoints = [...currentLine.points, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }]
    setCurrentLine({ ...currentLine, points: newPoints })
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!currentLine) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setLines([...lines, currentLine])
    setCurrentLine(null)
  }

  const getSvgPathFromLine = (line: Line) => {
    if (line.points.length < 2) return ""
    const [firstPoint, ...restPoints] = line.points
    return `M ${firstPoint.x} ${firstPoint.y} ${restPoints.map(p => `L ${p.x} ${p.y}`).join(" ")}`
  }

  const pointerEvents = isDrawingMode
    ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      }
    : {}

  return (
    <svg
      {...pointerEvents}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
      style={{ width: 30000, height: 30000, pointerEvents: isDrawingMode ? "auto" : "none" }}
    >
      {lines.map((line, index) => (
        <path
          key={`line-${index}`}
          d={getSvgPathFromLine(line)}
          stroke={line.color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {isDrawingMode && currentLine && (
        <path
          d={getSvgPathFromLine(currentLine)}
          stroke={currentLine.color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export function SourceDashboard() {
  const [isDrawingMode] = useAtom(drawingModeAtom)
  const allSources = useMemo(
    () =>
      typeSafeObjectEntries(sources)
        .filter(([_, source]) => !source.redirect)
        .map(([k, source]) => ({
          id: k as SourceID,
          title: source.title,
          column: source.column && (source.column in columns) ? columns[source.column as keyof typeof columns].zh : "未分类",
          name: source.name,
          pinyin: pinyin?.[k as keyof typeof pinyin] ?? "",
        })),
    [],
  )

  const cardPositions = useMemo(() => calculateJitteredGridLayout(allSources.length), [allSources.length])
  const allSourcesWithPos = useMemo(() => allSources.map((source, index) => ({
    ...source,
    position: cardPositions[index],
  })), [allSources, cardPositions])

  const cardWidth = 360
  const cardHeight = 520
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)

  const [viewState, setViewState] = useState<ReactZoomPanPinchState>({
    scale: 0.7,
    positionX: 0,
    positionY: 0,
  })

  const visibleCards = useMemo(() => {
    const { scale, positionX, positionY } = viewState
    const { innerWidth = 1920, innerHeight = 1080 } = typeof window !== "undefined" ? window : {}

    const viewX = -positionX / scale
    const viewY = -positionY / scale
    const viewWidth = innerWidth / scale
    const viewHeight = innerHeight / scale

    const buffer = 1200

    return allSourcesWithPos.filter(({ position }) => {
      const cardX1 = position.x - (cardWidth / 2)
      const cardX2 = position.x + (cardWidth / 2)
      const cardY1 = position.y - (cardHeight / 2)
      const cardY2 = position.y + (cardHeight / 2)

      return (
        cardX1 < viewX + viewWidth + buffer
        && cardX2 > viewX - buffer
        && cardY1 < viewY + viewHeight + buffer
        && cardY2 > viewY - buffer
      )
    })
  }, [allSourcesWithPos, viewState])

  return (
    <div className="w-full h-screen bg-dot-grid overflow-hidden">
      <BrushTools />
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@700;900&display=swap');
        
        .bg-dot-grid {
          background-color: #e8e8e8;
          background-image: radial-gradient(circle, #d0d0d0 1px, rgba(0,0,0,0) 1px);
          background-size: 20px 20px;
        }

        .newspaper-container {
          width: ${cardWidth}px;
          height: ${cardHeight}px;
          transition: width 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          overflow: hidden;
          box-shadow: 1px 1px 0 #e0ded9, 2px 2px 0 #e0ded9, 3px 3px 0 #e0ded9, 4px 4px 0 #e0ded9, 5px 5px 0 #e0ded9, 6px 6px 15px rgba(0,0,0,0.15);
          position: absolute;
          cursor: pointer;
        }
        .drawing-mode .newspaper-container {
          pointer-events: none;
        }
        .newspaper-container.is-open {
          width: ${cardWidth * 2}px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .page-wrapper {
          display: flex;
          width: ${cardWidth * 2}px;
          height: 100%;
        }
        .page {
          width: ${cardWidth}px;
          height: 100%;
          padding: 30px;
          box-sizing: border-box;
          background-color: #f7f5f0;
          font-family: 'Lato', sans-serif;
          color: #2c2c2c;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-left: 1px solid rgba(0,0,0,0.05);
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .page.left {
          border-right: 1px solid rgba(0,0,0,0.1);
        }
        .meta-header {
            border-bottom: 2px solid #2c2c2c; margin-bottom: 15px; padding-bottom: 5px;
            display: flex; justify-content: space-between; font-size: 0.75rem; text-transform: uppercase;
            letter-spacing: 1px; color: #666;
        }
        .headline {
            font-family: 'Playfair Display', serif; font-size: 2rem; line-height: 1.1;
            color: #2c2c2c; margin: 0 0 20px 0; font-weight: 900;
        }
        .body-content {
            font-size: 0.95rem; line-height: 1.6; color: #444;
            text-align: justify; flex-grow: 1;
        }
        .body-content.drop-cap ul li:first-child a::first-letter {
            float: left; font-family: 'Playfair Display', serif; font-size: 3.5rem;
            line-height: 0.8; padding-right: 8px; padding-top: 4px; color: #c0392b;
        }
        .close-btn {
            position: absolute; top: 15px; right: 15px; width: 30px; height: 30px;
            border-radius: 50%; background: rgba(0,0,0,0.05); color: #2c2c2c;
            border: none; cursor: pointer; display: flex; justify-content: center; align-items: center;
            opacity: 0; transition: all 0.3s; pointer-events: none; z-index: 10;
        }
        .is-open .close-btn { opacity: 1; pointer-events: auto; }
        .close-btn:hover { background: #c0392b; color: white; }
        `}
      </style>

      <TransformWrapper
        ref={transformRef}
        initialScale={0.7}
        minScale={0.1}
        maxScale={2}
        limitToBounds={false}
        panning={{ disabled: isDrawingMode }}
        zooming={{ disabled: isDrawingMode }}
        pinch={{ disabled: isDrawingMode }}
        doubleClick={{ disabled: isDrawingMode }}
        onTransformed={(ref, state) => setViewState(state)}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
          <div className={$("relative w-full h-full", isDrawingMode && "drawing-mode")}>
            {visibleCards.map(item => (
              <NewspaperCard
                key={item.id}
                item={item}
                position={item.position}
                transformRef={transformRef}
              />
            ))}
          </div>
          <DrawingCanvas />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

function calculateJitteredGridLayout(count: number) {
  const cardWidth = 360
  const cardHeight = 520
  const padding = 150
  const cellWidth = cardWidth + padding
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)

  const gridSlots = Array.from({ length: count }, (_, i) => ({
    r: Math.floor(i / cols),
    c: i % cols,
  }))

  for (let i = gridSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gridSlots[i], gridSlots[j]] = [gridSlots[j], gridSlots[i]]
  }

  return gridSlots.map(({ r, c }) => {
    const baseX = (c - (cols - 1) / 2) * cellWidth
    const baseY = r * (cardHeight + padding) - (rows - 1) * (cardHeight + padding) / 2
    const jitterX = (Math.random() - 0.5) * padding
    const jitterY = (Math.random() - 0.5) * padding
    return { x: baseX + jitterX, y: baseY + jitterY }
  })
}

function NewspaperCard({ item, position, transformRef }: { item: SourceItemProps, position: { x: number, y: number }, transformRef: React.RefObject<ReactZoomPanPinchRef> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCard, setActiveCard] = useAtom(activeCardAtom)
  const nodeRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["source", item.id, "preview"],
    queryFn: async () => myFetch<SourceResponse>(`/s?id=${item.id}`),
    enabled: true,
    staleTime: 1000 * 60 * 10,
  })

  const handleContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "A" || (e.target as HTMLElement).closest("button")) return

    if (isOpen) {
      setIsOpen(false)
    } else {
      if (nodeRef.current && transformRef.current) {
        setIsOpen(true)
        setActiveCard(item.id)
        transformRef.current.zoomToElement(nodeRef.current, 0.9, 600, "easeOut")
      }
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
  }

  const zIndex = activeCard === item.id ? 100 : 1
  const rotationStyle = useMemo(() => getRandomRotation(item.id), [item.id])

  return (
    <div
      ref={nodeRef}
      className={$("newspaper-container", isOpen && "is-open")}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: "translate(-50%, -50%)",
        zIndex,
        ...rotationStyle,
      }}
      onClick={handleContainerClick}
    >
      <div className="page-wrapper">
        <div className="page left">
          <div className="meta-header">
            <span>{item.title || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <div className="headline">{item.name}</div>
          <div className="body-content drop-cap">
            {isLoading
              ? <p>Loading...</p>
              : isError
                ? <p style={{ color: "#c0392b" }}>Failed to load.</p>
                : (
                    <ul>
                      {data?.items?.slice(0, 10).map(news => (
                        <li key={news.id}>
                          <a href={news.mobileUrl || news.url} target="_blank" rel="noreferrer" className="hover:text-[#c0392b]">
                            {news.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
          </div>
        </div>
        <div className="page right">
          <button type="button" className="close-btn" onClick={handleClose}>✕</button>
          <div className="meta-header">
            <span>
              More from
              {item.name}
            </span>
          </div>
          <div className="body-content">
            {isLoading
              ? <p>Loading...</p>
              : isError
                ? <p>Error</p>
                : (
                    <ul>
                      {data?.items?.slice(10, 22).map(news => (
                        <li key={news.id} className="mb-2">
                          <a href={news.mobileUrl || news.url} target="_blank" rel="noreferrer" className="hover:text-[#c0392b]">
                            {news.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
          </div>
        </div>
      </div>
    </div>
  )
}
