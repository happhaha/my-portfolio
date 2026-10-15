/**
 * 个人资料与技能 API。
 *
 * 前台的「个人介绍 / 技能展示」与后台的「个人信息管理」读写同一份数据，
 * 后台保存后前台刷新即可看到更新。
 */

import { assert, request, throwUnauthorized } from '@/api/client'
import { getSession } from '@/api/auth'
import { readProfileTable, readSkills, writeProfileTable, writeSkills } from '@/api/db'
import type { Profile, Skill, SkillCategory } from '@/types'
import { createId } from '@/utils/id'

/** 读取个人资料。 */
export async function fetchProfile(): Promise<Profile> {
  return request(() => readProfileTable(), { label: 'profile.fetch' })
}

export type ProfileUpdate = Partial<
  Omit<Profile, 'updatedAt'> & {
    socials: Partial<Profile['socials']>
  }
>

/**
 * 更新个人资料（部分字段）。需要登录。
 * socials 会与已有值合并，避免前端只传一部分就丢字段。
 */
export async function updateProfile(patch: ProfileUpdate): Promise<Profile> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      assert(patch.name === undefined || patch.name.trim().length > 0, '昵称不能为空')
      assert(patch.title === undefined || patch.title.trim().length > 0, '职位不能为空')

      const current = readProfileTable()
      const { socials, ...rest } = patch

      const next: Profile = {
        ...current,
        ...rest,
        socials: { ...current.socials, ...(socials ?? {}) },
        updatedAt: new Date().toISOString(),
      }

      return writeProfileTable(next)
    },
    { label: 'profile.update' },
  )
}

/* ------------------------------------------------------------------ */
/* 技能                                                                */
/* ------------------------------------------------------------------ */

export interface SkillInput {
  name: string
  category: SkillCategory
  level: number
  description?: string
}

/** 技能列表，按分类 + 熟练度倒序排列。 */
export async function fetchSkills(): Promise<Skill[]> {
  return request(() => sortSkills(readSkills()), { label: 'skills.fetch' })
}

/** 新增技能。需要登录。 */
export async function createSkill(input: SkillInput): Promise<Skill> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()
      validateSkill(input)

      const skill: Skill = {
        id: createId('skill'),
        name: input.name.trim(),
        category: input.category,
        level: clampLevel(input.level),
        description: input.description?.trim() ?? '',
      }

      writeSkills(sortSkills([...readSkills(), skill]))
      return skill
    },
    { label: 'skills.create' },
  )
}

/** 更新技能。需要登录。 */
export async function updateSkill(
  id: string,
  patch: Partial<SkillInput>,
): Promise<Skill> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const skills = readSkills()
      const index = skills.findIndex((skill) => skill.id === id)
      assert(index !== -1, '技能不存在', 404, 'NOT_FOUND')

      const merged: Skill = {
        ...skills[index],
        ...patch,
        name: (patch.name ?? skills[index].name).trim(),
        description: (patch.description ?? skills[index].description).trim(),
        level: clampLevel(patch.level ?? skills[index].level),
      }

      validateSkill(merged)
      skills[index] = merged
      writeSkills(sortSkills(skills))

      return merged
    },
    { label: 'skills.update' },
  )
}

/** 删除技能。需要登录。 */
export async function deleteSkill(id: string): Promise<{ id: string }> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()

      const skills = readSkills()
      const next = skills.filter((skill) => skill.id !== id)
      assert(next.length !== skills.length, '技能不存在', 404, 'NOT_FOUND')

      writeSkills(next)
      return { id }
    },
    { label: 'skills.delete' },
  )
}

/** 覆盖式保存全部技能（后台编辑后一次性提交）。需要登录。 */
export async function replaceSkills(skills: Skill[]): Promise<Skill[]> {
  return request(
    () => {
      if (!getSession()) throwUnauthorized()
      skills.forEach(validateSkill)

      const normalized = sortSkills(
        skills.map((skill) => ({
          ...skill,
          name: skill.name.trim(),
          description: skill.description.trim(),
          level: clampLevel(skill.level),
        })),
      )

      return writeSkills(normalized)
    },
    { label: 'skills.replace' },
  )
}

function validateSkill(skill: SkillInput | Skill): void {
  assert(skill.name.trim().length > 0, '技能名称不能为空')
  assert(skill.level >= 0 && skill.level <= 100, '熟练度需在 0-100 之间')
}

function clampLevel(level: number): number {
  return Math.min(100, Math.max(0, Math.round(level)))
}

/** 按「分类顺序 → 熟练度倒序 → 名称」排序，保证前后台展示一致。 */
function sortSkills(skills: Skill[]): Skill[] {
  const categoryWeight: Record<SkillCategory, number> = {
    frontend: 0,
    backend: 1,
    devops: 2,
    design: 3,
    other: 4,
  }

  return [...skills].sort((a, b) => {
    const weightDiff = categoryWeight[a.category] - categoryWeight[b.category]
    if (weightDiff !== 0) return weightDiff
    if (b.level !== a.level) return b.level - a.level
    return a.name.localeCompare(b.name)
  })
}
