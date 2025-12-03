import type { SourceID, SourceResponse } from "@shared/types"
import pinyin from "@shared/pinyin.json"
import { useMemo, useRef } from "react"
import { sources } from "@shared/sources"
import { columns } from "@shared/metadata"
import { typeSafeObjectEntries } from "@shared/type.util"
import { clsx as $ } from "clsx"
import { useQuery } from "@tanstack/react-query"
import { useInView } from "framer-motion"
import { myFetch } from "~/utils"
import { useFocusWith } from "~/hooks/useFocus"

interface SourceItemProps {
  id: SourceID
  name: string
  title?: string
  column: any
  pinyin: string
}

function groupByColumn(items: SourceItemProps[]) {
  return items.reduce((acc, item) => {
    const k = acc.find(i => i.column === item.column)
    if (k) k.sources = [...k.sources, item]
    else acc.push({ column: item.column, sources: [item] })
    return acc
  }, [] as {
    column: string
    sources: SourceItemProps[]
  }[]).sort((m, n) => {
    if (m.column === "科技") return -1
    if (n.column === "科技") return 1

    if (m.column === "未分类") return 1
    if (n.column === "未分类") return -1

    return m.column < n.column ? -1 : 1
  })
}

export function SourceDashboard() {
  const sourceItems = useMemo(
    () =>
      groupByColumn(typeSafeObjectEntries(sources)
        .filter(([_, source]) => !source.redirect)
        .map(([k, source]) => ({
          id: k as SourceID,
          title: source.title,
          column: source.column && (source.column in columns) ? columns[source.column as keyof typeof columns].zh : "未分类",
          name: source.name,
          pinyin: pinyin?.[k as keyof typeof pinyin] ?? "",
        })))
    , [],
  )

  return (
    <div className="min-h-screen w-full bg-[#222] text-[#e0e0e0] font-sans p-4 md:p-8 relative overflow-hidden">
      {/* Cement Wall Texture Simulation */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Spot Light */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(0,0,0,0.95))]" />

      <div className="max-w-7xl mx-auto relative z-10 animate-fade-in">
        {sourceItems.map(({ column, sources }) => (
          <div key={column} className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-neutral-400/80 tracking-widest uppercase flex items-center gap-3 border-b border-white/10 pb-2">
              <span className="i-ph-hash-duotone" />
              {column}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
              {sources.map(item => (
                column === "科技"
                  ? <InstaxCard key={item.id} item={item} />
                  : <NewspaperCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewspaperCard({ item }: { item: SourceItemProps }) {
  const { isFocused, toggleFocus } = useFocusWith(item.id)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "200px" })

  const { data, isLoading, isError } = useQuery({
    queryKey: ["source", item.id, "preview"],
    queryFn: async () => {
      const res = await myFetch<SourceResponse>(`/s?id=${item.id}`)
      return res
    },
    enabled: isInView,
    staleTime: 1000 * 60 * 5, // 5 mins
  })

  return (
    <div ref={ref} className="group relative transition-all duration-300 hover:scale-105 hover:z-20 hover:-rotate-1">
      {/* Scotch Tape */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-10 bg-white/20 backdrop-blur-[1px] rotate-[-5deg] z-20 shadow-sm border-l border-r border-white/10 pointer-events-none" />

      {/* Paper Body */}
      <div className="relative bg-[#e8e6e1] text-neutral-900 p-4 shadow-lg shadow-black/40 min-h-[220px] flex flex-col">
        {/* Jagged Bottom Edge Simulation */}
        <div
          className="absolute bottom-0 left-0 w-full h-[4px] bg-[#e8e6e1]"
          style={{
            clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)",
            transform: "translateY(99%)",
          }}
        />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col">
            {/* Marker Highlight */}
            <span className="relative inline-block mb-1">
              <span className="font-serif font-bold text-lg leading-tight relative z-10">{item.name}</span>
              <span className={$("absolute bottom-1 left-0 w-full h-2 -z-0 opacity-40 -rotate-1 rounded-sm", `bg-${sources[item.id].color}-500`)} />
            </span>
            {item.title && <span className="text-xs font-serif text-neutral-600 italic leading-tight">{item.title}</span>}
          </div>

          <button
            type="button"
            onClick={toggleFocus}
            className={$(
              "p-1 rounded-full transition-all",
              isFocused ? "text-red-700 opacity-100 scale-110" : "text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-700",
            )}
            title={isFocused ? "Remove from case" : "Add to case"}
          >
            <span className={$(isFocused ? "i-ph-push-pin-fill" : "i-ph-push-pin-duotone", "text-xl")} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading
            ? (
                <div className="space-y-2 opacity-40 animate-pulse">
                  <div className="h-2 bg-neutral-800 w-full rounded-[1px]" />
                  <div className="h-2 bg-neutral-800 w-[90%] rounded-[1px]" />
                  <div className="h-2 bg-neutral-800 w-[70%] rounded-[1px]" />
                  <div className="h-2 bg-neutral-800 w-[80%] rounded-[1px]" />
                </div>
              )
            : isError
              ? (
                  <div className="text-xs text-red-800/60 font-serif italic text-center mt-4">Unable to retrieve evidence.</div>
                )
              : (
                  <ul className="space-y-2">
                    {data?.items?.slice(0, 5).map(news => (
                      <li key={news.id} className="text-xs font-serif leading-snug group/item">
                        <span className="text-neutral-400 mr-1">-</span>
                        <a
                          href={news.mobileUrl || news.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-red-900 decoration-red-900/30 decoration-1 underline-offset-2 transition-colors"
                        >
                          {news.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
        </div>
      </div>
    </div>
  )
}

function InstaxCard({ item }: { item: SourceItemProps }) {
  const { isFocused, toggleFocus } = useFocusWith(item.id)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "200px" })

  const { data, isLoading } = useQuery({
    queryKey: ["source", item.id, "preview"],
    queryFn: async () => {
      const res = await myFetch<SourceResponse>(`/s?id=${item.id}`)
      return res
    },
    enabled: isInView,
    staleTime: 1000 * 60 * 5,
  })

  const topNews = data?.items?.[0]

  return (
    <div ref={ref} className="group relative transition-all duration-300 hover:scale-105 hover:z-20 hover:rotate-1">
      {/* Instax Body */}
      <div className="bg-white p-2 pb-8 shadow-xl shadow-black/50 relative overflow-hidden flex flex-col h-full">
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ mixBlendMode: "overlay" }} />

        {/* Photo Area */}
        <div className="bg-neutral-900 aspect-square w-full relative overflow-hidden mb-2 filter grayscale group-hover:grayscale-0 transition-all duration-500">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{ backgroundImage: `url(/icons/${item.id.split("-")[0]}.png)` }}
          />
          <div className="absolute inset-0 bg-black/20" />
          {" "}
          {/* Dimmer */}

          {/* Breaking News Overlay (If available) */}
          {topNews && (
            <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent text-white">
              <a href={topNews.mobileUrl || topNews.url} target="_blank" rel="noreferrer" className="block text-[10px] leading-tight font-sans hover:underline hover:text-yellow-300 line-clamp-3">
                {topNews.title}
              </a>
            </div>
          )}

          {isLoading && (
            <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/20 animate-pulse rounded" />
          )}
        </div>

        {/* Dymo Label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] flex justify-center z-20">
          <div className="bg-black text-white px-2 py-0.5 font-mono text-xs tracking-widest uppercase rounded-[2px] shadow-sm transform -rotate-1 border border-white/20 truncate text-center">
            {item.name}
          </div>
        </div>

        {/* Pin Action */}
        <button
          type="button"
          onClick={toggleFocus}
          className={$(
            "absolute top-1 right-1 p-1 z-30 transition-all",
            isFocused ? "text-yellow-400 opacity-100 drop-shadow-md" : "text-white opacity-0 group-hover:opacity-100 hover:text-yellow-300",
          )}
        >
          <span className={$(isFocused ? "i-ph-star-fill" : "i-ph-star-duotone", "text-lg")} />
        </button>
      </div>
    </div>
  )
}
