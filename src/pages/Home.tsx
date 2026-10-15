import { useCallback } from 'react'

import { ErrorNotice } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchProfile } from '@/api'
import About from '@/pages/sections/About'
import Hero from '@/pages/sections/Hero'
import LatestPosts from '@/pages/sections/LatestPosts'
import Projects from '@/pages/sections/Projects'
import Skills from '@/pages/sections/Skills'

/**
 * 前台首页。
 *
 * profile 在页面级只请求一次，向下传给 Hero 与 About，
 * 避免同一份数据在两个区块各拉一次。
 */
export default function Home() {
  const loader = useCallback(() => fetchProfile(), [])
  const { data: profile, loading, error, reload } = useAsyncData(loader)

  return (
    <div className="space-y-24 pb-8">
      <Hero profile={profile} loading={loading} />

      {error ? (
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <ErrorNotice message={`个人资料加载失败：${error}`} onRetry={reload} />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl space-y-24 px-5 sm:px-8">
        <About profile={profile} loading={loading} />
        <Skills />
        <Projects />
        <LatestPosts />
      </div>
    </div>
  )
}
