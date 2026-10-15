import { useMemo, useState } from 'react'

import PostCard from '@/components/PostCard'
import Reveal from '@/components/Reveal'
import { Badge, EmptyState, ErrorNotice, Skeleton, cn } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchPosts } from '@/api'

/** 博客列表页 /blog，支持按标签筛选。 */
export default function BlogList() {
  const { data: posts, loading, error, reload } = useAsyncData(() => fetchPosts())
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const tags = useMemo(() => {
    const counter = new Map<string, number>()
    ;(posts ?? []).forEach((post) => {
      post.tags.forEach((tag) => counter.set(tag, (counter.get(tag) ?? 0) + 1))
    })
    return Array.from(counter, ([tag, count]) => ({ tag, count })).sort(
      (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
    )
  }, [posts])

  const visible = useMemo(
    () => (activeTag ? (posts ?? []).filter((post) => post.tags.includes(activeTag)) : (posts ?? [])),
    [posts, activeTag],
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-16 sm:px-8">
      <header className="space-y-4">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-aurora-300">
          <span className="h-px w-8 bg-aurora-400/60" />
          Blog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">全部文章</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-night-300">
          共 {(posts ?? []).length} 篇已发布文章。点击标签可以筛选，点击标题进入正文。
        </p>
      </header>

      {tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors duration-200',
              activeTag === null
                ? 'border-aurora-400/50 bg-aurora-500/12 text-aurora-200'
                : 'border-night-600 text-night-300 hover:border-aurora-400/40 hover:text-white',
            )}
          >
            全部
          </button>

          {tags.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => setActiveTag((current) => (current === item.tag ? null : item.tag))}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors duration-200',
                activeTag === item.tag
                  ? 'border-plasma-400/50 bg-plasma-500/12 text-plasma-300'
                  : 'border-night-600 text-night-300 hover:border-plasma-400/40 hover:text-white',
              )}
            >
              #{item.tag}
              <span className="ml-1.5 text-night-500">{item.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {error ? <ErrorNotice message={error} onRetry={reload} /> : null}

        {loading && !posts ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-44 w-full" />
            ))}
          </div>
        ) : null}

        {!loading && visible.length === 0 ? (
          <EmptyState
            title={activeTag ? `标签 #${activeTag} 下暂无文章` : '暂无已发布文章'}
            description={activeTag ? '试试其它标签，或点击「全部」查看所有内容。' : undefined}
          />
        ) : null}

        {visible.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {visible.map((post, index) => (
              <Reveal key={post.id} delay={index * 60} className="h-full">
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-12 flex items-center gap-2 text-xs text-night-500">
        <Badge tone="default">提示</Badge>
        文章数据同样来自 localStorage，可在数据层扩展后台编辑能力。
      </p>
    </div>
  )
}
