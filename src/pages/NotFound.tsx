import { Link } from 'react-router-dom'

import { Button } from '@/components/ui'

/** 404 页面。 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-5 px-5 text-center sm:px-8">
      <p className="font-mono text-6xl font-bold text-night-700">404</p>
      <h1 className="text-2xl font-semibold text-white">这个页面飘到深空里去了</h1>
      <p className="max-w-md text-sm leading-relaxed text-night-300">
        你访问的地址不存在，可能链接已失效或被移动。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button>返回首页</Button>
        </Link>
        <Link to="/blog">
          <Button variant="secondary">浏览博客</Button>
        </Link>
      </div>
    </div>
  )
}
