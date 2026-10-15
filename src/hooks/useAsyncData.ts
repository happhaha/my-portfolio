import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

import { toErrorMessage } from '@/api/client'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface AsyncResult<T> extends AsyncState<T> {
  /** 重新执行请求 */
  reload: () => void
  /** 本地乐观更新（避免重新请求） */
  setData: (updater: T | ((previous: T | null) => T | null)) => void
}

/**
 * 声明式数据请求。
 *
 * 特性：
 * - 重新请求时保留上一次的 data（loading 期间界面不闪白）
 * - 组件卸载后不会 setState
 * - 返回 reload 用于写操作后刷新
 *
 * @example
 * const { data: projects, loading, error, reload } = useAsyncData(fetchProjects)
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: DependencyList = []): AsyncResult<T> {
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const [version, setVersion] = useState(0)
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let alive = true

    setState((previous) => ({ ...previous, loading: true, error: null }))

    loaderRef.current()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null })
      })
      .catch((caught: unknown) => {
        if (alive) setState({ data: null, loading: false, error: toErrorMessage(caught) })
      })

    return () => {
      alive = false
    }
    // loader 通过 ref 读取，因此只需要监听调用方声明的依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  const setData = useCallback((updater: T | ((previous: T | null) => T | null)) => {
    setState((previous) => ({
      ...previous,
      data: typeof updater === 'function' ? (updater as (p: T | null) => T | null)(previous.data) : updater,
    }))
  }, [])

  return { ...state, reload, setData }
}
