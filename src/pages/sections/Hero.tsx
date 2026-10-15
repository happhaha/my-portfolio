import { Link } from 'react-router-dom'

import { Badge, Button, Skeleton, cn } from '@/components/ui'
import type { Profile } from '@/types'
import { initialsOf } from '@/utils/format'

/** 首页 Hero 区：一句话定位 + 主行动按钮 + 关键数据。 */
export default function Hero({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  if (loading && !profile) {
    return (
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
        <div className="space-y-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-11 w-40" />
        </div>
      </section>
    )
  }

  if (!profile) return null

  const displayName = profile.name.trim()
  const jobTitle = profile.title.trim()
  const tagline = profile.tagline.trim()

  // 空字段不展示：既满足「没有个人资料时不出现占位符」，也避免出现「—」这类噪音
  const stats = [
    {
      label: '工作年限',
      value: profile.yearsOfExperience > 0 ? `${profile.yearsOfExperience}+` : '',
    },
    { label: '所在地', value: profile.location.trim() },
    { label: '邮箱', value: profile.email.trim() },
  ].filter((stat) => stat.value.length > 0)

  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="success" className="gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-300" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              目前开放远程合作机会
            </Badge>
            <span className="text-xs text-night-400">深空主题 · Canvas 星空背景</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {displayName ? (
                <>
                  你好，我是{' '}
                  <span className="bg-gradient-to-r from-aurora-300 via-aurora-200 to-plasma-300 bg-clip-text text-transparent">
                    {displayName}
                  </span>
                </>
              ) : (
                '你好，欢迎来到我的作品集'
              )}
            </h1>
            {jobTitle ? <p className="text-lg font-medium text-night-100">{jobTitle}</p> : null}
            {tagline ? (
              <p className="max-w-xl text-sm leading-relaxed text-night-300 sm:text-base">{tagline}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href="#projects">
              <Button size="lg" icon={<span aria-hidden="true">◆</span>}>
                查看项目
              </Button>
            </a>
            <a href="#blog">
              <Button size="lg" variant="secondary">
                阅读博客
              </Button>
            </a>
            {profile.resumeUrl ? (
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer noopener">
                <Button size="lg" variant="ghost">
                  下载简历
                </Button>
              </a>
            ) : null}
          </div>

          {stats.length > 0 ? (
            <dl className="grid max-w-lg grid-cols-1 gap-4 border-t border-night-700/60 pt-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <dt className="text-xs uppercase tracking-wider text-night-500">{stat.label}</dt>
                  <dd className="truncate text-sm font-medium text-night-100">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* 头像 / 轨道装饰 */}
        <div className="relative mx-auto flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
          <div className="absolute inset-0 rounded-full border border-night-700/70" />
          <div className="absolute inset-6 rounded-full border border-night-700/50" />
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-aurora-500/15 to-plasma-500/15 blur-2xl" />

          <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-aurora-400/30 bg-night-850/90 shadow-glow sm:h-40 sm:w-40">
            {profile.avatar ? (
              <img src={profile.avatar} alt={displayName || '头像'} className="h-full w-full object-cover" />
            ) : (
              <span className="bg-gradient-to-br from-aurora-200 to-plasma-300 bg-clip-text text-4xl font-bold text-transparent">
                {displayName ? initialsOf(displayName) : 'z'}
              </span>
            )}
          </div>

          <span className="absolute left-2 top-3 animate-float rounded-lg border border-night-600 bg-night-900/85 px-2.5 py-1 text-[11px] text-night-200 backdrop-blur-sm">
            TypeScript
          </span>
          <span
            className="absolute right-0 top-1/3 animate-float rounded-lg border border-night-600 bg-night-900/85 px-2.5 py-1 text-[11px] text-night-200 backdrop-blur-sm"
            style={{ animationDelay: '1.2s' }}
          >
            React
          </span>
          <span
            className="absolute bottom-6 left-6 animate-float rounded-lg border border-night-600 bg-night-900/85 px-2.5 py-1 text-[11px] text-night-200 backdrop-blur-sm"
            style={{ animationDelay: '2.1s' }}
          >
            Canvas
          </span>
        </div>
      </div>

      <Link
        to="/blog"
        className={cn(
          'mt-14 hidden items-center gap-2 text-xs text-night-400 transition-colors hover:text-aurora-200 sm:inline-flex',
        )}
      >
        <span className="h-px w-10 bg-night-600" />
        继续向下了解我
      </Link>
    </section>
  )
}
