import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'

/** 前台布局：导航 + 内容 + 页脚。 */
export default function SiteLayout() {
  const location = useLocation()

  // 路由切换后回到顶部（带 hash 时保留浏览器默认的锚点滚动）
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
