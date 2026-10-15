import { useCallback, useEffect, useState } from 'react'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNotice,
  Field,
  Input,
  Select,
  Skeleton,
  Textarea,
  cn,
} from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchProfile, fetchSkills, replaceSkills, updateProfile } from '@/api'
import type { ProfileUpdate } from '@/api'
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, type Profile, type Skill, type SkillCategory } from '@/types'
import { createId } from '@/utils/id'

interface Feedback {
  tone: 'success' | 'error'
  message: string
}

/** 后台「个人信息管理」/admin/profile */
export default function ProfileAdmin() {
  const profileState = useAsyncData(useCallback(() => fetchProfile(), []))
  const skillsState = useAsyncData(useCallback(() => fetchSkills(), []))

  const [form, setForm] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [skillDraft, setSkillDraft] = useState<Skill[] | null>(null)
  const [savingSkills, setSavingSkills] = useState(false)
  const [skillFeedback, setSkillFeedback] = useState<Feedback | null>(null)

  // 数据到达后初始化表单（只在首次 / 重新加载后同步）
  useEffect(() => {
    if (profileState.data) setForm(profileState.data)
  }, [profileState.data])

  useEffect(() => {
    if (skillsState.data) setSkillDraft(skillsState.data)
  }, [skillsState.data])

  const patchForm = (patch: Partial<Profile>) => {
    setForm((current) => (current ? { ...current, ...patch } : current))
    setFeedback(null)
  }

  const patchSocials = (patch: Partial<Profile['socials']>) => {
    setForm((current) => (current ? { ...current, socials: { ...current.socials, ...patch } } : current))
    setFeedback(null)
  }

  const handleSave = async () => {
    if (!form) return

    setSaving(true)
    setFeedback(null)

    try {
      const payload: ProfileUpdate = {
        name: form.name,
        title: form.title,
        tagline: form.tagline,
        bio: form.bio,
        avatar: form.avatar,
        email: form.email,
        location: form.location,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        resumeUrl: form.resumeUrl,
        socials: form.socials,
      }

      const next = await updateProfile(payload)
      setForm(next)
      profileState.setData(next)
      setFeedback({ tone: 'success', message: '个人资料已保存，前台刷新即可看到更新。' })
    } catch (error) {
      setFeedback({ tone: 'error', message: toMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  const handleResetForm = () => {
    setForm(profileState.data)
    setFeedback(null)
  }

  /* ----------------------------- 技能编辑 ----------------------------- */

  const addSkill = () => {
    setSkillDraft((current) => [
      ...(current ?? []),
      { id: createId('skill'), name: '', category: 'frontend', level: 70, description: '' },
    ])
    setSkillFeedback(null)
  }

  const patchSkill = (id: string, patch: Partial<Skill>) => {
    setSkillDraft((current) =>
      (current ?? []).map((skill) => (skill.id === id ? { ...skill, ...patch } : skill)),
    )
    setSkillFeedback(null)
  }

  const removeSkill = (id: string) => {
    setSkillDraft((current) => (current ?? []).filter((skill) => skill.id !== id))
    setSkillFeedback(null)
  }

  const handleSaveSkills = async () => {
    const draft = skillDraft ?? []

    if (draft.some((skill) => skill.name.trim().length === 0)) {
      setSkillFeedback({ tone: 'error', message: '技能名称不能为空，请补全或删除空行。' })
      return
    }

    setSavingSkills(true)
    setSkillFeedback(null)

    try {
      const next = await replaceSkills(draft)
      setSkillDraft(next)
      skillsState.setData(next)
      setSkillFeedback({ tone: 'success', message: `已保存 ${next.length} 条技能。` })
    } catch (error) {
      setSkillFeedback({ tone: 'error', message: toMessage(error) })
    } finally {
      setSavingSkills(false)
    }
  }

  const isFormLoading = profileState.loading && !form

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge tone="aurora">Profile</Badge>
        <h1 className="text-2xl font-semibold text-white">个人信息管理</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-night-300">
          这些内容会直接渲染到首页的 Hero 与「个人介绍」区块，技能则显示在「技能展示」区块。
        </p>
      </header>

      {profileState.error ? (
        <ErrorNotice message={profileState.error} onRetry={profileState.reload} />
      ) : null}

      {/* 基本信息 */}
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">基本信息</h2>
          {feedback ? (
            <span
              className={cn(
                'rounded-lg px-3 py-1 text-xs',
                feedback.tone === 'success'
                  ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border border-rose-400/30 bg-rose-500/10 text-rose-200',
              )}
            >
              {feedback.message}
            </span>
          ) : null}
        </div>

        {isFormLoading || !form ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSave()
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="昵称 / 姓名" htmlFor="profile-name" required>
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => patchForm({ name: event.target.value })}
                />
              </Field>

              <Field label="职位 / 角色" htmlFor="profile-title" required>
                <Input
                  id="profile-title"
                  value={form.title}
                  onChange={(event) => patchForm({ title: event.target.value })}
                />
              </Field>
            </div>

            <Field
              label="一句话标语"
              htmlFor="profile-tagline"
              hint="显示在首页 Hero 区标题下方，建议 1-2 句"
            >
              <Input
                id="profile-tagline"
                value={form.tagline}
                onChange={(event) => patchForm({ tagline: event.target.value })}
              />
            </Field>

            <Field
              label="个人介绍"
              htmlFor="profile-bio"
              hint="支持换行；空行会被忽略，其余每行渲染为一个段落"
            >
              <Textarea
                id="profile-bio"
                className="min-h-[160px]"
                value={form.bio}
                onChange={(event) => patchForm({ bio: event.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="邮箱" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => patchForm({ email: event.target.value })}
                />
              </Field>

              <Field label="所在地" htmlFor="profile-location">
                <Input
                  id="profile-location"
                  value={form.location}
                  onChange={(event) => patchForm({ location: event.target.value })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="工作年限" htmlFor="profile-years" hint="显示为「5+」">
                <Input
                  id="profile-years"
                  type="number"
                  min={0}
                  max={60}
                  value={form.yearsOfExperience}
                  onChange={(event) =>
                    patchForm({ yearsOfExperience: Number(event.target.value) || 0 })
                  }
                />
              </Field>

              <Field label="头像地址" htmlFor="profile-avatar" hint="留空则展示姓名首字缩写">
                <Input
                  id="profile-avatar"
                  placeholder="https://... 或 /avatar.png"
                  value={form.avatar}
                  onChange={(event) => patchForm({ avatar: event.target.value })}
                />
              </Field>
            </div>

            <Field label="简历链接" htmlFor="profile-resume" hint="填写后 Hero 区会显示「下载简历」按钮">
              <Input
                id="profile-resume"
                value={form.resumeUrl}
                onChange={(event) => patchForm({ resumeUrl: event.target.value })}
              />
            </Field>

            <fieldset className="space-y-4 rounded-xl border border-night-700/60 p-4">
              <legend className="px-1 text-xs text-night-400">社交链接</legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="GitHub" htmlFor="social-github">
                  <Input
                    id="social-github"
                    value={form.socials.github}
                    onChange={(event) => patchSocials({ github: event.target.value })}
                  />
                </Field>

                <Field label="个人博客" htmlFor="social-blog">
                  <Input
                    id="social-blog"
                    value={form.socials.blog}
                    onChange={(event) => patchSocials({ blog: event.target.value })}
                  />
                </Field>

                <Field label="Twitter / X" htmlFor="social-twitter">
                  <Input
                    id="social-twitter"
                    value={form.socials.twitter}
                    onChange={(event) => patchSocials({ twitter: event.target.value })}
                  />
                </Field>

                <Field label="展示用邮箱" htmlFor="social-email">
                  <Input
                    id="social-email"
                    value={form.socials.email}
                    onChange={(event) => patchSocials({ email: event.target.value })}
                  />
                </Field>
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-night-700/60 pt-4">
              <Button type="submit" loading={saving}>
                保存资料
              </Button>
              <Button type="button" variant="secondary" onClick={handleResetForm} disabled={saving}>
                撤销修改
              </Button>
              <span className="text-xs text-night-500">
                最后更新：{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : '—'}
              </span>
            </div>
          </form>
        )}
      </Card>

      {/* 技能编辑 */}
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">技能列表</h2>
            <p className="mt-1 text-xs text-night-400">
              熟练度为 0-100 的整数，用于前台进度条展示。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {skillFeedback ? (
              <span
                className={cn(
                  'rounded-lg px-3 py-1 text-xs',
                  skillFeedback.tone === 'success'
                    ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : 'border border-rose-400/30 bg-rose-500/10 text-rose-200',
                )}
              >
                {skillFeedback.message}
              </span>
            ) : null}
            <Button variant="secondary" size="sm" onClick={addSkill}>
              + 新增技能
            </Button>
          </div>
        </div>

        {skillsState.error ? (
          <ErrorNotice message={skillsState.error} onRetry={skillsState.reload} />
        ) : null}

        {skillsState.loading && !skillDraft ? (
          <Skeleton className="h-32 w-full" />
        ) : (skillDraft ?? []).length === 0 ? (
          <EmptyState
            title="还没有技能"
            description="点击「新增技能」添加第一条，保存后前台「技能展示」区块会立即更新。"
          />
        ) : (
          <ul className="space-y-3">
            {(skillDraft ?? []).map((skill) => (
              <li
                key={skill.id}
                className="grid gap-3 rounded-xl border border-night-700/60 bg-night-900/40 p-3 lg:grid-cols-[minmax(0,1.1fr)_150px_120px_minmax(0,1.3fr)_auto] lg:items-center"
              >
                <Input
                  aria-label="技能名称"
                  placeholder="技能名称，例如 TypeScript"
                  value={skill.name}
                  onChange={(event) => patchSkill(skill.id, { name: event.target.value })}
                />

                <Select
                  aria-label="技能分类"
                  value={skill.category}
                  onChange={(event) =>
                    patchSkill(skill.id, { category: event.target.value as SkillCategory })
                  }
                >
                  {SKILL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {SKILL_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </Select>

                <div className="flex items-center gap-2">
                  <input
                    aria-label="熟练度"
                    type="number"
                    min={0}
                    max={100}
                    value={skill.level}
                    onChange={(event) =>
                      patchSkill(skill.id, {
                        level: Math.min(100, Math.max(0, Number(event.target.value) || 0)),
                      })
                    }
                    className="h-10 w-16 rounded-lg border border-night-600 bg-night-900/70 px-2 text-center text-sm text-night-100 focus:border-aurora-400 focus:outline-none"
                  />
                  <span className="text-xs text-night-500">%</span>
                </div>

                <Input
                  aria-label="补充说明"
                  placeholder="补充说明（可选）"
                  value={skill.description}
                  onChange={(event) => patchSkill(skill.id, { description: event.target.value })}
                />

                <Button variant="danger" size="sm" onClick={() => removeSkill(skill.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        )}

        {(skillDraft ?? []).length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-night-700/60 pt-4">
            <Button loading={savingSkills} onClick={() => void handleSaveSkills()}>
              保存技能
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSkillDraft(skillsState.data)
                setSkillFeedback(null)
              }}
              disabled={savingSkills}
            >
              撤销修改
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作失败，请重试'
}
