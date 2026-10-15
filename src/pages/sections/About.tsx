import Reveal from '@/components/Reveal'
import SectionHeading from '@/components/SectionHeading'
import { Card, Skeleton, cn } from '@/components/ui'
import type { Profile } from '@/types'

/** 首页「个人介绍」区。所有字段为空时只展示引导文案，不留空白块。 */
export default function About({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  if (loading && !profile) {
    return (
      <section id="about" className="scroll-mt-24">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </section>
    )
  }

  if (!profile) return null

  const paragraphs = profile.bio
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const facts = [
    { label: '邮箱', value: profile.email.trim(), href: profile.email ? `mailto:${profile.email}` : '' },
    { label: '所在地', value: profile.location.trim(), href: '' },
    { label: 'GitHub', value: profile.socials.github, href: profile.socials.github },
    { label: '个人博客', value: profile.socials.blog, href: profile.socials.blog },
  ].filter((fact) => fact.value.length > 0)

  return (
    <section id="about" className="scroll-mt-24">
      <SectionHeading eyebrow="About" title="个人介绍" />

      <div
        className={cn(
          'mt-8 grid gap-6',
          facts.length > 0 && 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]',
        )}
      >
        <Reveal>
          <Card className="h-full space-y-4 text-sm leading-relaxed text-night-200">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <p className="text-night-400">
                还没有填写个人介绍。登录后台，在「个人信息管理」里补充你的自我介绍即可。
              </p>
            )}
          </Card>
        </Reveal>

        {facts.length > 0 ? (
          <Reveal delay={120}>
            <Card className="h-full space-y-4">
              <h3 className="text-sm font-semibold text-white">基本信息</h3>
              <dl className="space-y-3">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex flex-col gap-0.5 border-b border-night-700/50 pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="text-xs uppercase tracking-wider text-night-500">{fact.label}</dt>
                    <dd className="truncate text-sm text-night-100">
                      {fact.href ? (
                        <a
                          href={fact.href}
                          target={fact.href.startsWith('mailto:') ? undefined : '_blank'}
                          rel="noreferrer noopener"
                          className="transition-colors hover:text-aurora-200"
                        >
                          {fact.value}
                        </a>
                      ) : (
                        fact.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
