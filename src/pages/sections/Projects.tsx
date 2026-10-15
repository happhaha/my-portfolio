import { useCallback } from 'react'

import ProjectCard from '@/components/ProjectCard'
import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import { Button, EmptyState, ErrorNotice, Skeleton } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchProjects } from '@/api'

/** 首页「项目展示」区：优先展示精选项目，不足时用其余项目补齐。 */
export default function Projects() {
  const loader = useCallback(() => fetchProjects(), [])
  const { data: projects, loading, error, reload } = useAsyncData(loader)

  const list = projects ?? []
  const featured = list.filter((project) => project.featured)
  const rest = list.filter((project) => !project.featured)
  const display = [...featured, ...rest].slice(0, 6)

  return (
    <section id="projects" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Projects"
        title="项目展示"
        description="挑选了几个有代表性的项目，覆盖组件库、数据产品与工程化基础设施。"
        action={
          <a href="#blog" className="hidden text-xs text-night-300 transition-colors hover:text-aurora-200 sm:block">
            先看看文章 →
          </a>
        }
      />

      <div className="mt-8 space-y-4">
        {error ? <ErrorNotice message={error} onRetry={reload} /> : null}

        {loading && !projects ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-72 w-full" />
            ))}
          </div>
        ) : null}

        {!loading && display.length === 0 ? (
          <EmptyState
            title="还没有项目"
            description="登录后台后在「项目管理」中新增项目，前台会立即展示。"
            action={
              <a href="/admin/projects">
                <Button size="sm" variant="secondary">
                  去后台添加
                </Button>
              </a>
            }
          />
        ) : null}

        {display.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {display.map((project, index) => (
              <Reveal key={project.id} delay={index * 80} className="h-full">
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
