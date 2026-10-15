# AGENTS.md · 面向 AI 编码助手 / 新同事的项目约定

> 说明：本文件在项目初始化前为空文件。当前内容由初始化时的实现约定整理而成。

## 项目是什么

zz2 的个人作品集站点：前台展示（首页 / 博客）+ 后台管理（`/admin`）。
React 18 + TypeScript + Vite 5 + TailwindCSS 3，**没有后端**，
数据通过统一的 API 层存放在浏览器 localStorage。

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 本地开发，http://localhost:5173
npm run build        # 先 tsc --noEmit 再 vite build
npm run typecheck    # 只做类型检查
npm run preview      # 预览 dist 产物，http://localhost:4173
```

演示账号：`admin / admin123`（在 `src/data/seed.ts` 的 `DEMO_CREDENTIALS` 中定义）。

## 目录职责

| 目录 | 职责 | 不要做的事 |
| --- | --- | --- |
| `src/api` | 唯一接触 localStorage 的地方 | 不要在这里写 UI 相关逻辑 |
| `src/components` | 可复用展示组件 | 不要直接 import `utils/storage` |
| `src/pages` | 路由级页面与区块 | 不要绕过 api 层直接读写存储 |
| `src/hooks` | `useAuth` / `useAsyncData` | 不要在这里引入组件 |
| `src/utils` | 无副作用的纯函数 | 不要 import `api`（保持依赖单向） |
| `src/types` | 领域类型定义 | 不要放运行时代码（常量除外） |

依赖方向固定为：`pages → hooks/components → api → utils`。

## 硬性规则

1. **数据访问必须走 API 层**：任何读写都通过 `@/api` 暴露的函数。禁止在组件里
   直接 `localStorage.getItem`。
2. **写接口必须校验登录**：新增写接口时，函数体第一行用 `getSession()` 判断，
   未登录 `throwUnauthorized()`。
3. **返回值必须深拷贝**：新增接口请用 `request()` 包装，它已包含深拷贝与错误包装，
   这样组件才拿不到「数据库」对象的引用。
4. **类型先行**：新增实体先在 `src/types/index.ts` 定义，再写 api，再写界面。
5. **样式走令牌**：颜色只用 `tailwind.config.js` 里的 `night-* / aurora-* / plasma-*`，
   不要直接写 `slate-700`、`blue-500` 或十六进制色值。
6. **注释用中文**，解释「为什么」而不是复述代码。
7. **不要写伪代码**：提交的代码必须是可直接运行、且 `npm run typecheck` 通过的实现。
8. **个人资料一律空值降级**：`seedProfile()` 是不含任何内容的空壳，
   前台渲染 `profile` 的每个字段前都要先判断是否为空——为空就整项不渲染，
   不要写 `profile.email || '—'` 这类占位符，也不要留下空的卡片或标题。
   后台保存时 `name` 与 `title` 是必填项，这是有意的（Hero 标题区依赖它们）。

## 常见改动怎么做

### 新增一个前台页面

1. 在 `src/pages/` 建组件
2. 在 `src/App.tsx` 注册路由；若要复用导航和页脚，放进 `<Route element={<SiteLayout />}>` 这一层

### 新增一个后台页面

1. 在 `src/pages/admin/` 建组件
2. 在 `src/App.tsx` 的 `/admin` 子路由下注册（已由 `ProtectedRoute` 统一保护）
3. 在 `src/components/admin/AdminLayout.tsx` 的 `ADMIN_NAV` 里加导航项

### 新增一类数据

1. `src/types/index.ts` 定义类型
2. `src/utils/storage.ts` 的 `STORAGE_KEYS` 加键，并把 `SCHEMA_VERSION` 加 1（会自动重新播种）
3. `src/api/db.ts` 加读写函数
4. 新建 `src/api/xxx.ts` 写业务接口，并在 `src/api/index.ts` 导出
5. `src/data/seed.ts` 补种子数据

### 页面里请求数据

```tsx
const { data, loading, error, reload, setData } = useAsyncData(fetchProjects)
```

- 需要参数时：`useAsyncData(() => fetchPosts({ limit: 4 }), [deps])`
- 写完数据后要么 `reload()`，要么用 `setData` 做本地更新

### 表单提交

参考 `src/pages/admin/Profile.tsx`：本地 state 编辑 → 提交时调 api →
成功后用返回的数据回填 state 并展示成功提示，失败时展示 `error.message`。

## 验证清单（改完代码请自查）

- [ ] `npm run typecheck` 无错误
- [ ] `npm run build` 通过
- [ ] 首页五个区块（Hero / 介绍 / 技能 / 项目 / 博客）都有内容
- [ ] 未登录访问 `/admin`、`/admin/profile`、`/admin/projects` 会被重定向到登录页
- [ ] 登录后能跳回原本想访问的地址
- [ ] 后台改动后刷新前台能看到变化
- [ ] 退出登录后 session 从 localStorage 中被清除

## 注意

- 这是演示项目：密码散列在前端完成，localStorage 也不安全，不要用于真实敏感数据
- 数据只存在当前浏览器，换设备或清站点数据即丢失（后台可「恢复演示数据」回到初始状态）
- 博客的后台编辑界面尚未实现，但 `src/api/posts.ts` 已提供完整增删改接口
