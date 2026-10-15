/**
 * 项目 API。
 *
 * 读接口对前台开放；写接口全部要求登录（与真实后端一致：
 * 未登录时抛 401，由调用方决定跳转登录页）。
 */

import { assert, request, throwUnauthorized } from '@/api/client'
import { getSession } from '@/api/auth'
import { readProjects, writeProjects } from '@/api/db'
import type { ListQuery, Project, ProjectInput } from '@/types'
import { createId } from '@/utils/id'

export interface ProjectQuery extends ListQuery {
  /** 只看精选项目（首页使用） */
  featuredOnly?: boolean
  /** 按标签过滤 */
  tag?: string
}

/** 项目列表。默认按 order → createdAt 倒序排列。 */
export async function fetchProjects(query: ProjectQuery = {}): Promise<Project[]> {
  return request(
    () => {
      let list = sortProjects(readProjects())

      if (query.featuredOnly) list = list.filter((project) => project.featured)
      if (query.tag) list = list.filter((project) => project.tags.includes(query.tag as string))
      if (typeof query.limit === 'number') list = list.slice(0, query.limit)

      return list
    },
    { label: 'projects.fetch' },
  )
}

/** 单个项目详情。找不到抛 404。 */
export async function fetchProject(id: string): Promise<Project> {
  return request(
    () => {
      const project = readProjects().find((item) => item.id === id)
      assert(project, '项目不存在', 404, 'NOT_FOUND')
      return project
    },
    { label: 'projects.fetchOne' },
  )
}

/** 新建项目。需要登录。 */
export async function createProject(input: ProjectInput): Promise<Project> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()
      const normalized = validateProjectInput(input)

      const projects = readProjects()
      const now = new Date().toISOString()
      const project: Project = {
        id: createId('proj'),
        ...normalized,
        order: input.order ?? nextOrder(projects),
        createdAt: now,
        updatedAt: now,
      }

      writeProjects(sortProjects([...projects, project]))
      return project
    },
    { label: 'projects.create' },
  )
}

/** 更新项目（部分字段）。需要登录。 */
export async function updateProject(id: string, patch: Partial<ProjectInput>): Promise<Project> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const projects = readProjects()
      const index = projects.findIndex((item) => item.id === id)
      assert(index !== -1, '项目不存在', 404, 'NOT_FOUND')

      const merged: Project = {
        ...projects[index],
        ...patch,
        tags: patch.tags ? normalizeTags(patch.tags) : projects[index].tags,
        updatedAt: new Date().toISOString(),
      }

      validateProject(merged)
      projects[index] = merged
      writeProjects(sortProjects(projects))

      return merged
    },
    { label: 'projects.update' },
  )
}

/** 删除项目。需要登录。 */
export async function deleteProject(id: string): Promise<{ id: string }> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const projects = readProjects()
      const next = projects.filter((item) => item.id !== id)
      assert(next.length !== projects.length, '项目不存在', 404, 'NOT_FOUND')

      writeProjects(next)
      return { id }
    },
    { label: 'projects.delete' },
  )
}

/** 切换精选状态。需要登录。 */
export async function toggleProjectFeatured(id: string): Promise<Project> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const projects = readProjects()
      const index = projects.findIndex((item) => item.id === id)
      assert(index !== -1, '项目不存在', 404, 'NOT_FOUND')

      const updated: Project = {
        ...projects[index],
        featured: !projects[index].featured,
        updatedAt: new Date().toISOString(),
      }

      projects[index] = updated
      writeProjects(projects)
      return updated
    },
    { label: 'projects.toggleFeatured' },
  )
}

/** 交换两个项目的排序位置。需要登录。 */
export async function moveProject(id: string, direction: 'up' | 'down'): Promise<Project[]> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const sorted = sortProjects(readProjects())
      const index = sorted.findIndex((item) => item.id === id)
      assert(index !== -1, '项目不存在', 404, 'NOT_FOUND')

      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= sorted.length) return sorted

      const swapped = [...sorted]
      const [moved] = swapped.splice(index, 1)
      swapped.splice(target, 0, moved)

      // 重写 order，避免出现重复权重导致排序不稳定
      const reordered = swapped.map((project, position) => ({
        ...project,
        order: position + 1,
      }))

      writeProjects(reordered)
      return reordered
    },
    { label: 'projects.move' },
  )
}

/* ------------------------------------------------------------------ */
/* 内部工具                                                            */
/* ------------------------------------------------------------------ */

function nextOrder(projects: Project[]): number {
  return projects.reduce((max, project) => Math.max(max, project.order), 0) + 1
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function validateProjectInput(input: ProjectInput): Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'> {
  assert(input.title.trim().length > 0, '项目名称不能为空')
  assert(input.summary.trim().length > 0, '一句话简介不能为空')

  return {
    title: input.title.trim(),
    summary: input.summary.trim(),
    description: input.description?.trim() ?? '',
    tags: normalizeTags(input.tags ?? []),
    cover: input.cover?.trim() ?? '',
    repoUrl: input.repoUrl?.trim() ?? '',
    demoUrl: input.demoUrl?.trim() ?? '',
    featured: Boolean(input.featured),
  }
}

function validateProject(project: Project): void {
  assert(project.title.trim().length > 0, '项目名称不能为空')
  assert(project.summary.trim().length > 0, '一句话简介不能为空')
}

/** order 升序 → 创建时间倒序。 */
function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return b.createdAt.localeCompare(a.createdAt)
  })
}
