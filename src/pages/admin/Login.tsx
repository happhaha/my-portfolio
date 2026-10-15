import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button, Card, Field, Input } from '@/components/ui'
import { DEMO_CREDENTIALS } from '@/data/seed'
import { useAuth } from '@/hooks/useAuth'

interface LocationState {
  from?: string
}

/** 后台登录页 /admin/login */
export default function Login() {
  const { signIn, signingIn, error, clearError, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as LocationState | null

  const redirectTo = state?.from && state.from.startsWith('/admin') ? state.from : '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // 已登录用户直接跳到目标页，避免重复登录
  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true })
  }, [isAuthenticated, navigate, redirectTo])

  useEffect(() => {
    clearError()
  }, [clearError])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await signIn(username, password)
      navigate(redirectTo, { replace: true })
    } catch {
      // 错误信息已写入 AuthContext.error，由界面展示
    }
  }

  const fillDemo = () => {
    setUsername(DEMO_CREDENTIALS.username)
    setPassword(DEMO_CREDENTIALS.password)
    clearError()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-12 sm:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="hidden space-y-6 lg:block">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-aurora-400/40 bg-night-800/80 text-sm font-bold text-aurora-200">
              z
            </span>
            <span className="text-sm font-semibold text-night-100">
              zz2<span className="text-night-500">.dev</span>
            </span>
          </Link>

          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            作品集管理后台
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-night-300">
            在这里维护个人资料、技能与项目数据。所有改动写入浏览器 localStorage，
            前台刷新即可看到效果，无需后端服务。
          </p>

          <ul className="space-y-3 text-sm text-night-300">
            {['个人信息与技能编辑', '项目增删改与排序', '登录状态持久化 + 路由守卫'].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-aurora-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">登录</h2>
            <p className="text-xs text-night-400">
              使用演示账号 <span className="font-mono text-aurora-200">admin / admin123</span>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Field label="用户名" htmlFor="username" required>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="admin"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>

            <Field label="密码" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={signingIn}>
              {signingIn ? '登录中…' : '登录后台'}
            </Button>
          </form>

          <div className="flex items-center justify-between border-t border-night-700/60 pt-4 text-xs">
            <button
              type="button"
              onClick={fillDemo}
              className="text-aurora-300 transition-colors hover:text-aurora-200"
            >
              填入演示账号
            </button>
            <Link to="/" className="text-night-400 transition-colors hover:text-night-100">
              ← 返回前台
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
