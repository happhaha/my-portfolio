import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge, Button, Card, ErrorNotice, Skeleton } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/hooks/useAuth'
import { fetchPosts, fetchProfile, fetchProjects, fetchSkills, resetToSeed } from '@/api'
import { SKILL_CATEGORY_LABELS, type DashboardStats, type Skill, type SkillCategory } from '@/types'
import { formatDateTime, formatRelative } from '@/utils/format'

/** 后台仪表盘 /admin */
export default function Dashboard() {
  const { session } = useAuth()
  const [resetting, setResetting] = useState(false)

  const profileLoader = useCallback(() => fetchProfile(), [])
  const projectsLoader = useCallback(() => fetchProjects(), [])
  const skillsLoader = useCallback(() => fetchSkills(), [])
  const postsLoader = useCallback(() => fetchPosts({ includeDrafts: true }), [])

  const profile = useAsyncData(profileLoader)
  const projects = useAsyncData(projectsLoader)
  const skills = useAsyncData(skillsLoader)
  const posts = useAsyncData(postsLoader)

  const isLoading = profile.loading || projects.loading || skills.loading || posts.loading
  const error = profile.error ?? projects.error ?? skills.error ?? posts.error

  const stats = useMemo<DashboardStats>(() => {
    const projectList = projects.data ?? []
    const postList = posts.data ?? []

    return {
      projectCount: projectList.length,
      featuredProjectCount: projectList.filter((project) => project.featured).length,
      skillCount: (skills.data ?? []).length,
      postCount: postList.length,
      publishedPostCount: postList.filter((post) => post.published).length,
      lastUpdatedAt: profile.data?.updatedAt ?? '',
    }
  }, [projects.data, posts.data, skills.data, profile.data])

  const reloadAll = () => {
    profile.reload()
    projects.reload()
    skills.reload()
    posts.reload()
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      '确定要恢复演示数据吗？当前对个人资料、技能、项目和文章的修改都会丢失。',
    )
    if (!confirmed) return

    setResetting(true)
    resetToSeed()
    reloadAll()
    // 同步操作，下一帧恢复按钮状态，避免闪烁
    window.setTimeout(() => setResetting(false), 260)
  }

  const cards = [
    {
      label: '项目总数',
      value: String(stats.projectCount),
      hint: `其中精选 ${stats.featuredProjectCount} 个`,
      to: '/admin/projects',
    },
    {
      label: '技能条目',
      value: String(stats.skillCount),
      hint: '按分类展示在前台',
      to: '/admin/profile',
    },
    {
      label: '已发布文章',
      value: String(stats.publishedPostCount),
      hint: `草稿 ${stats.postCount - stats.publishedPostCount} 篇`,
      to: '/blog',
    },
    {
      label: '资料更新时间',
      value: profile.data ? formatRelative(stats.lastUpdatedAt) : '—',
      hint: profile.data ? formatDateTime(stats.lastUpdatedAt) : '',
      to: '/admin/profile',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-night-700/70 bg-gradient-to-br from-night-850/80 via-night-900/70 to-night-900/50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge tone="aurora">Dashboard</Badge>
            <h1 className="text-2xl font-semibold text-white">
              欢迎回来，{session?.displayName ?? '管理员'}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-night-300">
              这里汇总了作品集的内容概况。所有数据存放在浏览器 localStorage 中，清空站点数据即可回到初始状态。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/" target="_blank">
              <Button variant="secondary" size="sm">
                预览前台
              </Button>
            </Link>
            <Button variant="danger" size="sm" loading={resetting} onClick={handleReset}>
              恢复演示数据
            </Button>
          </div>
        </div>
      </section>

      {error ? <ErrorNotice message={error} onRetry={reloadAll} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="space-y-3">
            {isLoading && !profile.data ? (
              <>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wider text-night-500">{card.label}</p>
                <p className="text-2xl font-semibold text-white">{card.value}</p>
                <p className="text-xs text-night-400">{card.hint}</p>
                <Link
                  to={card.to}
                  className="inline-block text-xs text-aurora-300 transition-colors hover:text-aurora-200"
                >
                  前往管理 →
                </Link>
              </>
            )}
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-white">最近项目</h2>
          {projects.loading && !projects.data ? (
            <Skeleton className="h-20 w-full" />
          ) : (projects.data ?? []).length === 0 ? (
            <p className="text-xs text-night-400">还没有项目，去「项目管理」新增一个。</p>
          ) : (
            <ul className="space-y-3">
              {(projects.data ?? []).slice(0, 4).map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between gap-3 border-b border-night-700/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-night-100">{project.title}</p>
                    <p className="truncate text-xs text-night-500">{project.summary}</p>
                  </div>
                  {project.featured ? <Badge tone="warning">精选</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-white">内容速览</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3 border-b border-night-700/50 pb-3">
              <span className="shrink-0 text-night-300">最新文章</span>
              <span className="truncate text-night-100">{(posts.data ?? [])[0]?.title ?? '暂无文章'}</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-night-700/50 pb-3">
              <span className="shrink-0 text-night-300">技能最多的分类</span>
              <span className="truncate text-night-100">{topSkillCategory(skills.data ?? [])}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-night-300">前台入口</span>
              <Link to="/" className="text-aurora-300 transition-colors hover:text-aurora-200">
                查看首页 →
              </Link>
            </li>
          </ul>
        </Card>
      </section>
    </div>
  )
}

/** 统计技能条目最多的分类，用于「内容速览」。 */
function topSkillCategory(skills: Skill[]): string {
  if (skills.length === 0) return '暂无数据'

  const counter = new Map<SkillCategory, number>()
  skills.forEach((skill) => counter.set(skill.category, (counter.get(skill.category) ?? 0) + 1))

  const [top] = Array.from(counter).sort((a, b) => b[1] - a[1])
  if (!top) return '暂无数据'

  return `${SKILL_CATEGORY_LABELS[top[0]]}（${top[1]} 项）`
}
