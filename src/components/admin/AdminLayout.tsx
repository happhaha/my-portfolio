import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Button, cn } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

const ADMIN_NAV = [
  { to: '/admin', label: '仪表盘', end: true, icon: '▦' },
  { to: '/admin/profile', label: '个人信息', end: false, icon: '◐' },
  { to: '/admin/projects', label: '项目管理', end: false, icon: '◆' },
]

/** 后台布局：左侧导航 + 顶栏 + 内容区。 */
export default function AdminLayout() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    navigate('/admin/login', { replace: true })
  }

  const navLinks = (
    <nav className="space-y-1">
      {ADMIN_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
              isActive
                ? 'border border-aurora-400/40 bg-aurora-500/12 text-white'
                : 'border border-transparent text-night-300 hover:bg-night-800/60 hover:text-white',
            )
          }
        >
          <span aria-hidden="true" className="text-xs text-aurora-300">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* 桌面端侧边栏 */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 shrink-0 flex-col justify-between rounded-2xl border border-night-700/70 bg-night-900/60 p-4 backdrop-blur-sm lg:flex">
          <div className="space-y-6">
            <Link to="/admin" className="flex items-center gap-2.5 px-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-aurora-400/40 bg-night-800/80 text-sm font-bold text-aurora-200">
                z
              </span>
              <span className="text-sm font-semibold text-night-100">后台管理</span>
            </Link>
            {navLinks}
          </div>

          <div className="space-y-3 border-t border-night-700/70 pt-4">
            <div className="px-1">
              <p className="text-xs text-night-400">当前账号</p>
              <p className="truncate text-sm text-night-100">{session?.displayName ?? '—'}</p>
            </div>
            <Link
              to="/"
              className="block rounded-lg px-3 py-2 text-xs text-night-300 transition-colors hover:bg-night-800/60 hover:text-white"
            >
              ← 返回前台
            </Link>
            <Button variant="secondary" size="sm" className="w-full" onClick={handleSignOut}>
              退出登录
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          {/* 顶栏 */}
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-night-700/70 bg-night-900/60 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="切换后台导航"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-night-600 bg-night-800/60 text-night-200 lg:hidden"
              >
                ☰
              </button>
              <div>
                <p className="text-sm font-semibold text-white">个人作品集管理后台</p>
                <p className="text-xs text-night-400">
                  数据保存在浏览器 localStorage，清除站点数据会重置为演示内容
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/" className="text-xs text-night-300 transition-colors hover:text-aurora-200 lg:hidden">
                前台
              </Link>
              <Button variant="secondary" size="sm" onClick={handleSignOut} className="lg:hidden">
                退出
              </Button>
            </div>
          </header>

          {/* 移动端折叠导航 */}
          {mobileNavOpen ? (
            <div className="rounded-2xl border border-night-700/70 bg-night-900/80 p-4 backdrop-blur-sm lg:hidden">
              {navLinks}
            </div>
          ) : null}

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
