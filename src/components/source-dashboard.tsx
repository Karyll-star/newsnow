import type { SourceID } from "@shared/types"
import pinyin from "@shared/pinyin.json"
import { useMemo } from "react"
import { sources } from "@shared/sources"
import { columns } from "@shared/metadata"
import { typeSafeObjectEntries } from "@shared/type.util"
import { clsx as $ } from "clsx"
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {sourceItems.map(({ column, sources }) => (
        <div key={column} className="mb-10">
          <h2 className="text-xl font-bold mb-4 opacity-70 flex items-center gap-2">
            <span className="i-ph-hash-duotone" />
            {column}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sources.map(item => (
              <SourceCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SourceCard({ item }: { item: SourceItemProps }) {
  const { isFocused, toggleFocus } = useFocusWith(item.id)

  return (
    <div className="group relative flex items-center justify-between p-3 rounded-xl bg-base shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 hover:translate-y--1">
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className="w-10 h-10 rounded-lg bg-cover flex-shrink-0 shadow-sm"
          style={{ backgroundImage: `url(/icons/${item.id.split("-")[0]}.png)` }}
        />
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">{item.name}</span>
          {item.title && <span className="text-xs text-neutral-400 truncate">{item.title}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={toggleFocus}
        className={$(
          "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
          isFocused ? "text-primary opacity-100" : "text-neutral-400 hover:text-primary hover:bg-primary/10",
        )}
        title={isFocused ? "取消关注" : "关注"}
      >
        <span className={$(isFocused ? "i-ph-star-fill" : "i-ph-star-duotone", "text-xl")} />
      </button>
    </div>
  )
}
