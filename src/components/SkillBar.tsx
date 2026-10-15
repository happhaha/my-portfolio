import type { Skill } from '@/types'

/** 技能进度条。进入视口后动画展开（依赖 Reveal 的淡入，这里只做宽度过渡）。 */
export default function SkillBar({ skill }: { skill: Skill }) {
  const level = Math.min(100, Math.max(0, skill.level))

  return (
    <li className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-night-100">{skill.name}</span>
        <span className="font-mono text-xs text-night-400">{level}%</span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-night-800"
        role="progressbar"
        aria-label={`${skill.name} 熟练度`}
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-aurora-400 to-plasma-400 transition-[width] duration-1000 ease-smooth"
          style={{ width: `${level}%` }}
        />
      </div>

      {skill.description ? (
        <p className="text-xs leading-relaxed text-night-400">{skill.description}</p>
      ) : null}
    </li>
  )
}
