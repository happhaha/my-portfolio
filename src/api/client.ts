/**
 * API 层基础设施：统一入口 request()、结构化错误 ApiError、模拟网络延迟。
 *
 * 设计目标：让业务代码现在就按「真实后端」的方式写，
 * 将来把各 api 模块的函数体换成 fetch 即可，调用方零改动。
 */

/** 与 HTTP 状态码语义对齐的结构化错误。 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 400, code = 'BAD_REQUEST') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 模拟网络耗时区间（毫秒）。 */
const LATENCY_MIN = 120
const LATENCY_MAX = 380

function randomLatency(): number {
  return LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * 深拷贝返回值，模拟 HTTP 的 JSON 序列化。
 * 防止组件拿到「数据库」里的对象引用后直接修改，绕过 API 层。
 */
export function clone<T>(value: T): T {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value)) as T
}

export interface RequestOptions {
  /** 固定延迟（毫秒），不传则随机；传 0 可关闭延迟（例如首屏读取）。 */
  delay?: number
  /** 调试用标签，出错时输出日志。 */
  label?: string
}

/**
 * 统一请求包装：注入延迟、捕获异常并统一转换为 ApiError。
 *
 * @example
 * const profile = await request(() => readProfile(), { label: 'profile.get' })
 */
export async function request<T>(
  handler: () => T | Promise<T>,
  options: RequestOptions = {},
): Promise<T> {
  const latency = options.delay ?? randomLatency()
  if (latency > 0) await sleep(latency)

  try {
    const result = await handler()
    return clone(result)
  } catch (error) {
    if (error instanceof ApiError) throw error

    const message = error instanceof Error ? error.message : '服务异常，请稍后重试'
    if (options.label) console.error(`[api] ${options.label} 失败：`, error)
    throw new ApiError(message, 500, 'INTERNAL_ERROR')
  }
}

/** 断言条件，不成立时抛出 400。常用于入参校验。 */
export function assert(condition: unknown, message: string, status = 400, code = 'VALIDATION_ERROR'): asserts condition {
  if (!condition) throw new ApiError(message, status, code)
}

/** 未登录 / 会话过期统一抛 401。 */
export function throwUnauthorized(message = '登录状态已失效，请重新登录'): never {
  throw new ApiError(message, 401, 'UNAUTHORIZED')
}

/** 资源不存在统一抛 404。 */
export function throwNotFound(message = '资源不存在'): never {
  throw new ApiError(message, 404, 'NOT_FOUND')
}

/** 把任意异常转换为可以直接展示给用户的文案。 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return '发生未知错误，请稍后重试'
}
