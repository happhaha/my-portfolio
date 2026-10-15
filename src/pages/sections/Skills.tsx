import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import SkillBar from '@/components/SkillBar'
import { Card, EmptyState, ErrorNotice, Skeleton } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchSkills } from '@/api'
import { SKILL_CATEGORY_LABELS, SKILL_CATEGORIES, type Skill } from '@/types'

/** 首页「技能展示」区，按分类分组渲染。 */
export default function Skills() {
  const { data: skills, loading, error, reload } = useAsyncData(fetchSkills)

  const grouped = SKILL_CATEGORIES.map((category) => ({
    category,
    items: (skills ?? []).filter((skill) => skill.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <section id="skills" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Skills"
        title="技能展示"
        description="熟练度是我对自己当前水平的自评，右侧百分比用于直观对比，不代表绝对能力边界。"
      />

      <div className="mt-8 space-y-4">
        {error ? <ErrorNotice message={error} onRetry={reload} /> : null}

        {loading && !skills ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1].map((key) => (
              <Skeleton key={key} className="h-56 w-full" />
            ))}
          </div>
        ) : null}

        {!loading && skills && skills.length === 0 ? (
          <EmptyState
            title="还没有技能数据"
            description="在后台「个人信息 → 技能」中新增技能后，这里会自动展示。"
          />
        ) : null}

        {grouped.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {grouped.map((group, index) => (
              <Reveal key={group.category} delay={index * 90}>
                <Card className="h-full space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      {SKILL_CATEGORY_LABELS[group.category]}
                    </h3>
                    <span className="font-mono text-xs text-night-500">{group.items.length} 项</span>
                  </div>
                  <ul className="space-y-4">
                    {group.items.map((skill: Skill) => (
                      <SkillBar key={skill.id} skill={skill} />
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
