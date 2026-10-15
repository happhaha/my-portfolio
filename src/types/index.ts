/**
 * 全局领域类型定义。
 * 这里定义的形状同时约束 localStorage 中的存储结构与 API 层的出入参。
 */

/** 社交链接，空字符串表示未填写。 */
export interface SocialLinks {
  github: string
  blog: string
  twitter: string
  email: string
}

/** 个人资料（前台「个人介绍」与后台「个人信息管理」共享同一份数据）。 */
export interface Profile {
  name: string
  /** 职位 / 角色，例如：前端工程师 */
  title: string
  /** Hero 区一句话标语 */
  tagline: string
  /** 个人介绍正文，支持 \n 换行 */
  bio: string
  /** 头像地址，允许外链或 / 开头的本地路径 */
  avatar: string
  email: string
  location: string
  /** 工作年限，用于 Hero 区数据统计 */
  yearsOfExperience: number
  socials: SocialLinks
  resumeUrl: string
  updatedAt: string
}

/** 技能分类。 */
export type SkillCategory = 'frontend' | 'backend' | 'devops' | 'design' | 'other'

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: '前端',
  backend: '后端',
  devops: '工程化 / 运维',
  design: '设计',
  other: '其他',
}

export const SKILL_CATEGORIES: SkillCategory[] = ['frontend', 'backend', 'devops', 'design', 'other']

/** 技能项。level 为 0-100 的熟练度，用于进度条展示。 */
export interface Skill {
  id: string
  name: string
  category: SkillCategory
  level: number
  description: string
}

/** 项目。 */
export interface Project {
  id: string
  title: string
  /** 列表卡片上展示的一句话简介 */
  summary: string
  /** 详情描述，支持 \n 换行 */
  description: string
  tags: string[]
  cover: string
  repoUrl: string
  demoUrl: string
  /** 是否在首页「精选项目」中优先展示 */
  featured: boolean
  /** 排序权重，越小越靠前 */
  order: number
  createdAt: string
  updatedAt: string
}

/** 新建项目时的入参，其余字段由后端（模拟层）补全。 */
export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'> &
  Partial<Pick<Project, 'order'>>

/** 博客文章。 */
export interface Post {
  id: string
  slug: string
  title: string
  summary: string
  /** Markdown 风格的纯文本正文 */
  content: string
  tags: string[]
  cover: string
  published: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'slug'> &
  Partial<Pick<Post, 'slug' | 'publishedAt'>>

/** 后台账号。passwordHash 由 utils/hash 生成，仅用于前端演示。 */
export interface User {
  id: string
  username: string
  displayName: string
  passwordHash: string
  createdAt: string
}

/** 登录会话，写入 localStorage 的 `portfolio:auth:session`。 */
export interface Session {
  token: string
  userId: string
  username: string
  displayName: string
  /** 签发时间戳（ms） */
  issuedAt: number
  /** 过期时间戳（ms） */
  expiresAt: number
}

/** API 层返回值包装，用于模拟真实 HTTP 响应体。 */
export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

/** 仪表盘统计数据。 */
export interface DashboardStats {
  projectCount: number
  featuredProjectCount: number
  skillCount: number
  postCount: number
  publishedPostCount: number
  lastUpdatedAt: string
}

/** 统一分页 / 过滤参数。 */
export interface ListQuery {
  /** 最多返回多少条 */
  limit?: number
  /** 是否包含未发布内容（仅后台使用） */
  includeDrafts?: boolean
}
