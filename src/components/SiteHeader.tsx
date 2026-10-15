import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { cn } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { label: '关于我', hash: '#about' },
  { label: '技能', hash: '#skills' },
  { label: '项目', hash: '#projects' },
  { label: '博客', hash: '#blog' },
]

/** 前台顶部导航。在非首页时锚点会自动带上 `/` 前缀，保证能跳回首页对应区块。 */
export default function SiteHeader() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isHome = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 路由变化时收起移动端菜单
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300 ease-smooth',
        scrolled
          ? 'border-b border-night-700/70 bg-night-950/80 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-aurora-400/40 bg-night-800/80 text-sm font-bold text-aurora-200">
            z
            <span className="absolute inset-0 rounded-lg ring-1 ring-aurora-400/0 transition-all duration-300 group-hover:ring-aurora-400/40" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-night-100">
            zz2<span className="text-night-500">.dev</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.hash}
              href={isHome ? item.hash : `/${item.hash}`}
              className="rounded-md px-3 py-2 text-sm text-night-300 transition-colors duration-200 hover:bg-night-800/60 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/blog"
            className="rounded-md px-3 py-2 text-sm text-night-300 transition-colors duration-200 hover:bg-night-800/60 hover:text-white"
          >
            全部文章
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={isAuthenticated ? '/admin' : '/admin/login'}
            className="hidden rounded-lg border border-night-600 bg-night-800/60 px-3.5 py-2 text-xs font-medium text-night-200 transition-all duration-200 hover:border-aurora-400/50 hover:text-white sm:inline-flex"
          >
            {isAuthenticated ? '进入后台' : '后台登录'}
          </Link>

          <button
            type="button"
            aria-label="切换导航菜单"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-night-600 bg-night-800/60 text-night-200 md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={cn(
                  'absolute left-0 block h-0.5 w-4 bg-current transition-transform duration-200',
                  menuOpen ? 'top-1.5 rotate-45' : 'top-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-1.5 block h-0.5 w-4 bg-current transition-opacity duration-200',
                  menuOpen && 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 block h-0.5 w-4 bg-current transition-transform duration-200',
                  menuOpen ? 'top-1.5 -rotate-45' : 'top-3',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-night-700/70 bg-night-950/95 px-5 py-3 backdrop-blur-xl md:hidden">
          <ul className="grid gap-1">
            {[...NAV_ITEMS, { label: '全部文章', hash: '/blog' }].map((item) => (
              <li key={item.hash}>
                <a
                  href={item.hash.startsWith('/') ? item.hash : isHome ? item.hash : `/${item.hash}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-night-200 transition-colors hover:bg-night-800/70 hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to={isAuthenticated ? '/admin' : '/admin/login'}
                className="block rounded-md px-3 py-2 text-sm text-aurora-200 transition-colors hover:bg-night-800/70"
              >
                {isAuthenticated ? '进入后台' : '后台登录'}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
