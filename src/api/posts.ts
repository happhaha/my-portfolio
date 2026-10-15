/**
 * 博客 API。
 *
 * 前台只读已发布文章；写接口（create / update / delete）同样走统一 request 包装，
 * 后台暂未提供博客管理界面，接口先按真实后端的形式留好。
 */

import { assert, request, throwUnauthorized } from '@/api/client'
import { getSession } from '@/api/auth'
import { readPosts, writePosts } from '@/api/db'
import type { ListQuery, Post, PostInput } from '@/types'
import { createId, slugify } from '@/utils/id'

/** 文章列表。默认只返回已发布内容，按发布时间倒序。 */
export async function fetchPosts(query: ListQuery = {}): Promise<Post[]> {
  return request(
    () => {
      let list = sortPosts(readPosts())

      if (!query.includeDrafts) list = list.filter((post) => post.published)
      if (typeof query.limit === 'number') list = list.slice(0, query.limit)

      return list
    },
    { label: 'posts.fetch' },
  )
}

/** 按 slug 取文章。未发布的内容仅登录后可见。 */
export async function fetchPostBySlug(slug: string): Promise<Post> {
  return request(
    () => {
      const post = readPosts().find((item) => item.slug === slug)
      assert(post, '文章不存在或已删除', 404, 'NOT_FOUND')
      assert(post.published || Boolean(getSession()), '文章尚未发布', 403, 'FORBIDDEN')
      return post
    },
    { label: 'posts.fetchBySlug' },
  )
}

/** 相关文章推荐：优先同标签，其次最新。 */
export async function fetchRelatedPosts(slug: string, limit = 2): Promise<Post[]> {
  return request(
    () => {
      const posts = sortPosts(readPosts()).filter((post) => post.published)
      const current = posts.find((post) => post.slug === slug)
      const others = posts.filter((post) => post.slug !== slug)

      if (!current) return others.slice(0, limit)

      return others
        .map((post) => ({
          post,
          score: post.tags.filter((tag) => current.tags.includes(tag)).length,
        }))
        .sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt))
        .slice(0, limit)
        .map((item) => item.post)
    },
    { label: 'posts.fetchRelated' },
  )
}

/** 新建文章。需要登录。 */
export async function createPost(input: PostInput): Promise<Post> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()
      const normalized = validatePostInput(input)

      const posts = readPosts()
      const slug = ensureUniqueSlug(input.slug || normalized.title, posts)
      const now = new Date().toISOString()
      const post: Post = {
        id: createId('post'),
        slug,
        ...normalized,
        publishedAt: input.publishedAt ?? (normalized.published ? now : ''),
        createdAt: now,
        updatedAt: now,
      }

      writePosts(sortPosts([...posts, post]))
      return post
    },
    { label: 'posts.create' },
  )
}

/** 更新文章。需要登录。 */
export async function updatePost(id: string, patch: Partial<PostInput>): Promise<Post> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const posts = readPosts()
      const index = posts.findIndex((item) => item.id === id)
      assert(index !== -1, '文章不存在', 404, 'NOT_FOUND')

      const current = posts[index]
      const merged: Post = {
        ...current,
        ...patch,
        tags: patch.tags ? Array.from(new Set(patch.tags.map((tag) => tag.trim()).filter(Boolean))) : current.tags,
        slug: patch.slug ? ensureUniqueSlug(patch.slug, posts, current.id) : current.slug,
        publishedAt:
          patch.publishedAt !== undefined
            ? patch.publishedAt
            : patch.published && !current.publishedAt
              ? new Date().toISOString()
              : current.publishedAt,
        updatedAt: new Date().toISOString(),
      }

      assert(merged.title.trim().length > 0, '标题不能为空')
      posts[index] = merged
      writePosts(sortPosts(posts))

      return merged
    },
    { label: 'posts.update' },
  )
}

/** 删除文章。需要登录。 */
export async function deletePost(id: string): Promise<{ id: string }> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const posts = readPosts()
      const next = posts.filter((post) => post.id !== id)
      assert(next.length !== posts.length, '文章不存在', 404, 'NOT_FOUND')

      writePosts(next)
      return { id }
    },
    { label: 'posts.delete' },
  )
}

/** 全部标签及出现次数，用于博客列表的标签筛选。 */
export async function fetchPostTags(): Promise<Array<{ tag: string; count: number }>> {
  return request(
    () => {
      const counter = new Map<string, number>()

      readPosts()
        .filter((post) => post.published)
        .forEach((post) => {
          post.tags.forEach((tag) => counter.set(tag, (counter.get(tag) ?? 0) + 1))
        })

      return Array.from(counter, ([tag, count]) => ({ tag, count })).sort(
        (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
      )
    },
    { label: 'posts.tags' },
  )
}

/* ------------------------------------------------------------------ */
/* 内部工具                                                            */
/* ------------------------------------------------------------------ */

function validatePostInput(
  input: PostInput,
): Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'slug'> {
  assert(input.title.trim().length > 0, '标题不能为空')
  assert(input.content.trim().length > 0, '正文不能为空')

  return {
    title: input.title.trim(),
    summary: input.summary?.trim() || input.content.trim().slice(0, 100),
    content: input.content.trim(),
    tags: Array.from(new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    cover: input.cover?.trim() ?? '',
    published: Boolean(input.published),
  }
}

function ensureUniqueSlug(candidate: string, posts: Post[], ignoreId?: string): string {
  const base = slugify(candidate)
  let slug = base
  let suffix = 2

  while (posts.some((post) => post.slug === slug && post.id !== ignoreId)) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}

/** 已发布的按发布时间倒序；未发布的（草稿）排在最前，便于后台查看。 */
function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.published !== b.published) return a.published ? 1 : -1
    const left = a.publishedAt || a.createdAt
    const right = b.publishedAt || b.createdAt
    return right.localeCompare(left)
  })
}
