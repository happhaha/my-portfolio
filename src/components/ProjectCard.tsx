import { Badge, Card } from '@/components/ui'
import type { Project } from '@/types'

/** 项目展示卡片（前台首页 / 项目列表共用）。 */
export default function ProjectCard({ project }: { project: Project }) {
  const hasLinks = Boolean(project.repoUrl || project.demoUrl)

  return (
    <Card interactive className="flex h-full flex-col gap-4">
      {/* 封面：没有配图时用渐变 + 首字母占位，避免出现空白块 */}
      <div className="relative h-36 overflow-hidden rounded-xl border border-night-700/60 bg-gradient-to-br from-night-800 via-night-850 to-night-900">
        {project.cover ? (
          <img
            src={project.cover}
            alt={`${project.title} 封面`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="bg-gradient-to-br from-aurora-300 to-plasma-300 bg-clip-text text-4xl font-bold text-transparent">
              {project.title.slice(0, 2)}
            </span>
          </div>
        )}

        {project.featured ? (
          <span className="absolute right-2 top-2 rounded-full border border-amber-400/40 bg-night-950/80 px-2 py-0.5 text-[10px] font-medium text-amber-200 backdrop-blur-sm">
            精选
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <h3 className="text-base font-semibold text-white">{project.title}</h3>
        <p className="text-sm leading-relaxed text-night-300">{project.summary}</p>

        {project.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li key={tag}>
                <Badge tone="aurora">{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hasLinks ? (
        <div className="flex items-center gap-3 border-t border-night-700/60 pt-3 text-xs">
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-aurora-300 transition-colors hover:text-aurora-200"
            >
              在线预览 →
            </a>
          ) : null}
          {project.repoUrl ? (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-night-300 transition-colors hover:text-night-100"
            >
              源码
            </a>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
