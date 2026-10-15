import { useCallback, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNotice,
  Field,
  Input,
  Skeleton,
  Switch,
  Textarea,
  cn,
} from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import {
  createProject,
  deleteProject,
  fetchProjects,
  moveProject,
  toggleProjectFeatured,
  updateProject,
} from '@/api'
import type { Project, ProjectInput } from '@/types'
import { formatDate } from '@/utils/format'

/** 编辑器用的草稿结构：tags 在表单里以逗号分隔的字符串编辑。 */
interface ProjectDraft {
  id: string | null
  title: string
  summary: string
  description: string
  tagsText: string
  cover: string
  repoUrl: string
  demoUrl: string
  featured: boolean
  order: number
}

type EditorMode = 'closed' | 'create' | 'edit'

const EMPTY_DRAFT: ProjectDraft = {
  id: null,
  title: '',
  summary: '',
  description: '',
  tagsText: '',
  cover: '',
  repoUrl: '',
  demoUrl: '',
  featured: false,
  order: 0,
}

function toDraft(project: Project): ProjectDraft {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    description: project.description,
    tagsText: project.tags.join(', '),
    cover: project.cover,
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    featured: project.featured,
    order: project.order,
  }
}

function toInput(draft: ProjectDraft): ProjectInput {
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    description: draft.description.trim(),
    tags: draft.tagsText
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    cover: draft.cover.trim(),
    repoUrl: draft.repoUrl.trim(),
    demoUrl: draft.demoUrl.trim(),
    featured: draft.featured,
    order: draft.order,
  }
}

/** 后台「项目管理」/admin/projects */
export default function ProjectsAdmin() {
  const { data: projects, loading, error, reload, setData } = useAsyncData(
    useCallback(() => fetchProjects(), []),
  )

  const [mode, setMode] = useState<EditorMode>('closed')
  const [draft, setDraft] = useState<ProjectDraft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'featured' | 'normal'>('all')

  const list = projects ?? []
  const visible = list.filter((project) => {
    if (filter === 'featured') return project.featured
    if (filter === 'normal') return !project.featured
    return true
  })

  const patchDraft = (patch: Partial<ProjectDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setFeedback(null)
  }

  const openCreate = () => {
    setMode('create')
    setDraft({ ...EMPTY_DRAFT, order: list.length + 1 })
    setFeedback(null)
  }

  const openEdit = (project: Project) => {
    setMode('edit')
    setDraft(toDraft(project))
    setFeedback(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEditor = () => {
    setMode('closed')
    setDraft(EMPTY_DRAFT)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setFeedback(null)

    try {
      if (mode === 'create') {
        const created = await createProject(toInput(draft))
        setData((current) => [...(current ?? []), created])
        setFeedback({ tone: 'success', message: `项目「${created.title}」已创建。` })
      } else if (draft.id) {
        const updated = await updateProject(draft.id, toInput(draft))
        setData((current) => (current ?? []).map((item) => (item.id === updated.id ? updated : item)))
        setFeedback({ tone: 'success', message: `项目「${updated.title}」已更新。` })
      }

      closeEditor()
      reload()
    } catch (caught) {
      setFeedback({ tone: 'error', message: toMessage(caught) })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`确定删除项目「${project.title}」吗？该操作不可撤销。`)) return

    setBusyId(project.id)
    try {
      await deleteProject(project.id)
      setData((current) => (current ?? []).filter((item) => item.id !== project.id))
      if (draft.id === project.id) closeEditor()
      setFeedback({ tone: 'success', message: `项目「${project.title}」已删除。` })
    } catch (caught) {
      setFeedback({ tone: 'error', message: toMessage(caught) })
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleFeatured = async (project: Project) => {
    setBusyId(project.id)
    try {
      const updated = await toggleProjectFeatured(project.id)
      setData((current) => (current ?? []).map((item) => (item.id === updated.id ? updated : item)))
    } catch (caught) {
      setFeedback({ tone: 'error', message: toMessage(caught) })
    } finally {
      setBusyId(null)
    }
  }

  const handleMove = async (project: Project, direction: 'up' | 'down') => {
    setBusyId(project.id)
    try {
      const next = await moveProject(project.id, direction)
      setData(next)
    } catch (caught) {
      setFeedback({ tone: 'error', message: toMessage(caught) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="aurora">Projects</Badge>
          <h1 className="text-2xl font-semibold text-white">项目管理</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-night-300">
            前台「项目展示」会优先展示精选项目（最多 6 个），其余项目按排序值升序排列。
          </p>
        </div>

        <Button onClick={openCreate} icon={<span aria-hidden="true">+</span>}>
          新增项目
        </Button>
      </header>

      {feedback ? (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            feedback.tone === 'success'
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-400/30 bg-rose-500/10 text-rose-200',
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      {error ? <ErrorNotice message={error} onRetry={reload} /> : null}

      {/* 编辑器 */}
      {mode !== 'closed' ? (
        <Card className="space-y-5 border-aurora-400/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {mode === 'create' ? '新增项目' : `编辑：${draft.title || '未命名项目'}`}
            </h2>
            <Button variant="ghost" size="sm" onClick={closeEditor}>
              收起
            </Button>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmit()
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="项目名称" htmlFor="project-title" required>
                <Input
                  id="project-title"
                  value={draft.title}
                  onChange={(event) => patchDraft({ title: event.target.value })}
                />
              </Field>

              <Field label="排序值" htmlFor="project-order" hint="数字越小越靠前">
                <Input
                  id="project-order"
                  type="number"
                  min={0}
                  value={draft.order}
                  onChange={(event) => patchDraft({ order: Number(event.target.value) || 0 })}
                />
              </Field>
            </div>

            <Field label="一句话简介" htmlFor="project-summary" required hint="展示在卡片上，建议 40 字以内">
              <Input
                id="project-summary"
                value={draft.summary}
                onChange={(event) => patchDraft({ summary: event.target.value })}
              />
            </Field>

            <Field
              label="详细描述"
              htmlFor="project-description"
              hint="支持换行；以 · 开头会被渲染成要点列表"
            >
              <Textarea
                id="project-description"
                className="min-h-[140px]"
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
              />
            </Field>

            <Field label="技术标签" htmlFor="project-tags" hint="用逗号分隔，例如：React, TypeScript, Vite">
              <Input
                id="project-tags"
                value={draft.tagsText}
                onChange={(event) => patchDraft({ tagsText: event.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="封面图地址" htmlFor="project-cover">
                <Input
                  id="project-cover"
                  value={draft.cover}
                  onChange={(event) => patchDraft({ cover: event.target.value })}
                />
              </Field>

              <Field label="演示地址" htmlFor="project-demo">
                <Input
                  id="project-demo"
                  value={draft.demoUrl}
                  onChange={(event) => patchDraft({ demoUrl: event.target.value })}
                />
              </Field>

              <Field label="源码地址" htmlFor="project-repo">
                <Input
                  id="project-repo"
                  value={draft.repoUrl}
                  onChange={(event) => patchDraft({ repoUrl: event.target.value })}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-night-700/60 pt-4">
              <Switch
                id="project-featured"
                label="标记为精选项目"
                checked={draft.featured}
                onChange={(next) => patchDraft({ featured: next })}
              />

              <div className="ml-auto flex items-center gap-3">
                <Button variant="secondary" onClick={closeEditor} disabled={saving}>
                  取消
                </Button>
                <Button type="submit" loading={saving}>
                  {mode === 'create' ? '创建项目' : '保存修改'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      {/* 列表 */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">
            项目列表
            <span className="ml-2 font-mono text-xs text-night-500">{list.length} 个</span>
          </h2>

          <div className="flex items-center gap-2 text-xs">
            {(
              [
                ['all', '全部'],
                ['featured', '精选'],
                ['normal', '普通'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-full border px-3 py-1 transition-colors duration-200',
                  filter === value
                    ? 'border-aurora-400/50 bg-aurora-500/12 text-aurora-200'
                    : 'border-night-600 text-night-300 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && !projects ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-20 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={list.length === 0 ? '还没有项目' : '当前筛选条件下没有项目'}
            description={list.length === 0 ? '点击右上角「新增项目」创建第一个项目。' : '试试切换筛选条件。'}
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((project, index) => (
              <li
                key={project.id}
                className="flex flex-col gap-3 rounded-xl border border-night-700/60 bg-night-900/40 p-4 transition-colors duration-200 hover:border-aurora-400/30 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-night-500">#{project.order}</span>
                    <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                    {project.featured ? <Badge tone="warning">精选</Badge> : null}
                    {project.demoUrl ? <Badge tone="success">有演示</Badge> : null}
                  </div>

                  <p className="text-xs leading-relaxed text-night-400">{project.summary}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-night-500">
                    <span>更新于 {formatDate(project.updatedAt)}</span>
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded border border-night-600 px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === project.id || index === 0}
                    onClick={() => void handleMove(project, 'up')}
                    aria-label="上移"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === project.id || index === visible.length - 1}
                    onClick={() => void handleMove(project, 'down')}
                    aria-label="下移"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === project.id}
                    onClick={() => void handleToggleFeatured(project)}
                  >
                    {project.featured ? '取消精选' : '设为精选'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(project)}>
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busyId === project.id}
                    onClick={() => void handleDelete(project)}
                  >
                    删除
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请重试'
}
