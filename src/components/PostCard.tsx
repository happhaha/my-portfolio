import { Link } from 'react-router-dom'

import { Badge, Card, cn } from '@/components/ui'
import type { Post } from '@/types'
import { formatDate, readingTime, truncate } from '@/utils/format'

/** 博客列表项（首页「博客列表」与 /blog 共用）。 */
export default function PostCard({ post, className }: { post: Post; className?: string }) {
  return (
    <Card interactive className={cn('flex h-full flex-col gap-3', className)}>
      <div className="flex items-center gap-3 text-xs text-night-400">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span className="h-1 w-1 rounded-full bg-night-500" />
        <span>{readingTime(post.content)}</span>
        {post.published ? null : <Badge tone="warning">草稿</Badge>}
      </div>

      <h3 className="text-base font-semibold leading-snug text-white">
        <Link to={`/blog/${post.slug}`} className="transition-colors hover:text-aurora-200">
          {post.title}
        </Link>
      </h3>

      <p className="flex-1 text-sm leading-relaxed text-night-300">{truncate(post.summary, 110)}</p>

      {post.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li key={tag}>
              <Badge tone="violet">#{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}
