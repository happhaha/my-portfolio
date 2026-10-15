import { Link, useParams } from 'react-router-dom'

import MarkdownLite from '@/components/MarkdownLite'
import { Badge, Button, Card, ErrorNotice, Skeleton } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchPostBySlug, fetchRelatedPosts } from '@/api'
import { formatDate, readingTime } from '@/utils/format'

/** 博客详情页 /blog/:slug */
export default function BlogPost() {
  const { slug = '' } = useParams<{ slug: string }>()

  const { data: post, loading, error, reload } = useAsyncData(() => fetchPostBySlug(slug), [slug])
  const { data: related } = useAsyncData(() => fetchRelatedPosts(slug, 2), [slug])

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-10 pt-12 sm:px-8">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-xs text-night-400 transition-colors hover:text-aurora-200"
      >
        ← 返回文章列表
      </Link>

      {error ? (
        <div className="mt-8 space-y-4">
          <ErrorNotice message={error} onRetry={reload} />
          <Link to="/blog">
            <Button variant="secondary" size="sm">
              浏览其它文章
            </Button>
          </Link>
        </div>
      ) : null}

      {loading && !post ? (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {post ? (
        <>
          <header className="mt-6 space-y-4 border-b border-night-700/60 pb-6">
            <h1 className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-night-400">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span className="h-1 w-1 rounded-full bg-night-500" />
              <span>{readingTime(post.content)}</span>
              {post.published ? (
                <Badge tone="success">已发布</Badge>
              ) : (
                <Badge tone="warning">草稿（仅登录可见）</Badge>
              )}
            </div>

            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link to="/blog">
                      <Badge tone="violet">#{tag}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {post.summary ? (
              <p className="rounded-xl border border-night-700/60 bg-night-900/50 px-4 py-3 text-sm leading-relaxed text-night-300">
                {post.summary}
              </p>
            ) : null}
          </header>

          <div className="mt-8">
            <MarkdownLite content={post.content} />
          </div>

          {related && related.length > 0 ? (
            <section className="mt-14 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-night-400">继续阅读</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <Card key={item.id} interactive className="space-y-2">
                    <p className="text-xs text-night-500">{formatDate(item.publishedAt)}</p>
                    <Link
                      to={`/blog/${item.slug}`}
                      className="block text-sm font-medium text-night-100 transition-colors hover:text-aurora-200"
                    >
                      {item.title}
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </article>
  )
}
