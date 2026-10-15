import { Link } from 'react-router-dom'

import PostCard from '@/components/PostCard'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchPosts } from '@/api'

/** 首页「博客列表」区：展示最新 4 篇已发布文章。 */
export default function LatestPosts() {
  const { data: posts, loading, error, reload } = useAsyncData(() => fetchPosts({ limit: 4 }))

  return (
    <section id="blog" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Blog"
        title="博客列表"
        description="记录技术方案、踩坑复盘与一些关于工程效率的思考。"
        action={
          <Link
            to="/blog"
            className="text-xs text-aurora-300 transition-colors hover:text-aurora-200"
          >
            查看全部文章 →
          </Link>
        }
      />

      <div className="mt-8 space-y-4">
        {error ? <ErrorNotice message={error} onRetry={reload} /> : null}

        {loading && !posts ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-44 w-full" />
            ))}
          </div>
        ) : null}

        {!loading && posts && posts.length === 0 ? (
          <EmptyState title="暂无已发布文章" description="在数据层新增文章并标记为已发布后，这里会展示。" />
        ) : null}

        {posts && posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
              <Reveal key={post.id} delay={index * 80} className="h-full">
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
