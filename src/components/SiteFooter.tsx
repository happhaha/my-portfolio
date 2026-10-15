import { Link } from 'react-router-dom'

import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchProfile } from '@/api'

/** 前台页脚。社交链接来自个人资料，改一处前后台同步。 */
export default function SiteFooter() {
  const { data: profile } = useAsyncData(fetchProfile)
  const year = new Date().getFullYear()

  // 个人资料被清空时回落到站点标识，避免页脚出现空白
  const displayName = profile?.name.trim() || 'zz2'
  const jobTitle = profile?.title.trim() ?? ''

  const links = profile
    ? [
        { label: 'GitHub', href: profile.socials.github },
        { label: '博客', href: profile.socials.blog },
        { label: 'Email', href: profile.socials.email ? `mailto:${profile.socials.email}` : '' },
        { label: 'Twitter', href: profile.socials.twitter },
      ].filter((item) => Boolean(item.href))
    : []

  return (
    <footer className="mt-24 border-t border-night-700/60 bg-night-950/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-night-100">
            {displayName}
            {jobTitle ? (
              <span className="ml-2 text-xs font-normal text-night-400">{jobTitle}</span>
            ) : null}
          </p>
          <p className="text-xs text-night-500">
            © {year} {displayName} · 使用 React + TypeScript + Vite + TailwindCSS 构建
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-night-300">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="transition-colors hover:text-aurora-200"
            >
              {link.label}
            </a>
          ))}
          <Link to="/admin" className="transition-colors hover:text-aurora-200">
            后台管理
          </Link>
        </div>
      </div>
    </footer>
  )
}
