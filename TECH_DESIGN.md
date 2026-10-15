# TECH DESIGN · 个人作品集网站

> 说明：本文件在项目初始化前为空文件。当前内容由初始化时的实现方案整理而成。

## 1. 技术选型

| 关注点 | 选择 | 理由 |
| --- | --- | --- |
| 构建工具 | Vite 5 | 冷启动快，配置少，`@vitejs/plugin-react` 开箱即用 |
| UI 框架 | React 18 | Hooks + 函数组件，生态成熟 |
| 语言 | TypeScript 5（`strict` + `noUnusedLocals`） | 数据层与 API 契约靠类型约束 |
| 样式 | TailwindCSS 3 | 用配置里的语义化调色板当设计令牌 |
| 路由 | React Router 6 | 支持嵌套路由与布局路由，守卫用包装组件实现 |
| 数据 | localStorage + 统一 API 层 | 无后端阶段先对齐接口语义 |

不引入状态管理库：跨页面共享的只有登录态，用 Context 即可；
其余数据都是「页面级读取 + 写后刷新」，用 `useAsyncData` 足够。

## 2. 目录结构

```
src
├── api/                 # 唯一允许接触 localStorage 的地方
│   ├── client.ts        # request() 包装、ApiError、模拟延迟、深拷贝
│   ├── db.ts            # 各「表」读写 + ensureSeeded()
│   ├── auth.ts          # 登录 / 登出 / 当前会话 / 改密
│   ├── profile.ts       # 个人资料 + 技能
│   ├── projects.ts      # 项目 CRUD、精选切换、排序
│   ├── posts.ts         # 文章 CRUD、按 slug 查询、相关推荐
│   └── index.ts         # 统一出口（业务层只 import '@/api'）
├── components/          # 展示型组件
│   ├── Starfield.tsx    # Canvas 星空背景
│   ├── ProtectedRoute.tsx
│   ├── ui.tsx           # Button / Input / Field / Card / Badge / Spinner 等
│   └── admin/AdminLayout.tsx
├── context/AuthContext.tsx
├── data/seed.ts         # 首次运行的种子数据
├── hooks/               # useAuth / useAsyncData
├── pages/               # 路由级页面，含 sections/ 与 admin/
├── types/index.ts       # 领域类型
└── utils/               # storage / hash / id / format
```

分层规则：`pages → hooks/components → api → utils`。
`utils` 不依赖 `api`，`api` 不依赖 `components`。

## 3. 数据层设计

### 3.1 存储键

统一前缀 `portfolio:`，避免与同源其它应用冲突。

| 键 | 内容 |
| --- | --- |
| `portfolio:meta:schema-version` | 数据结构版本号 |
| `portfolio:auth:users` | 账号列表（密码只存散列） |
| `portfolio:auth:session` | 当前会话 |
| `portfolio:content:profile` | 个人资料 |
| `portfolio:content:skills` | 技能列表 |
| `portfolio:content:projects` | 项目列表 |
| `portfolio:content:posts` | 文章列表 |

`utils/storage.ts` 负责读写与容错：
JSON 解析失败时清除脏数据并回落到默认值；localStorage 不可用（隐私模式）时降级为内存 Map。

### 3.2 播种策略

`api/db.ts` 的 `ensureSeeded()` 在 `main.tsx` 渲染前同步执行：

- 关键表缺失 → 播种全套演示数据
- `SCHEMA_VERSION` 与当前代码不一致 → 清空后重新播种（不做数据迁移）
- 后台「恢复演示数据」按钮调用 `resetToSeed()`，它只覆盖内容表、**保留登录会话**

`seedProfile()` 刻意返回全空值：个人资料属于「站点所有者自己的内容」，
不适合放占位数据。技能 / 项目 / 文章则播种示例内容，保证首页开箱有东西可看。

因此前台的渲染规则是**空值降级**：

| 字段为空 | 表现 |
| --- | --- |
| `name` | Hero 标题从「你好，我是 X」切换为「你好，欢迎来到我的作品集」；头像回落到站点标识 `z` |
| `title` / `tagline` | 整行不渲染 |
| `yearsOfExperience` 为 0、`location` / `email` 为空 | Hero 的统计区整块不渲染 |
| `bio` 为空 | 「个人介绍」卡片显示引导文案 |
| 基本信息（邮箱 / 所在地 / GitHub / 博客）全空 | 该卡片不渲染，栅格自动变为单列 |
| 页脚 `name` 为空 | 回落到站点标识 `zz2` |

后台保存时 `name` 与 `title` 为必填（为空会返回「昵称不能为空」/「职位不能为空」），
因为 Hero 的标题区依赖这两个字段。

### 3.3 API 层契约

所有接口都经过 `request()`：

```
request(handler, { label })
  → 注入 120-380ms 随机延迟（模拟网络）
  → 执行 handler（内部用 assert() 校验入参）
  → JSON 深拷贝返回值（模拟 HTTP 序列化，防止组件直接改到「数据库」对象）
  → 异常统一包装成 ApiError { message, status, code }
```

错误码约定与 HTTP 状态对齐：`400` 参数校验、`401` 未登录、`403` 无权限、
`404` 不存在、`409` 冲突、`500` 内部异常。

读接口对前台开放；写接口统一先 `getSession()`，未登录直接抛 401。

## 4. 鉴权与路由守卫

- 密码用 `cyrb53` 加盐散列后存储（仅演示；生产必须换成后端 bcrypt/argon2）
- 登录成功写入会话：`{ token, userId, username, displayName, issuedAt, expiresAt }`，有效期 7 天
- `getSession()` 是**同步**的，因此首次渲染即可确定登录态，不会出现「已登录却闪一下登录页」
- `AuthProvider` 监听 `storage` 事件，多标签页之间登录 / 退出互相同步
- `ProtectedRoute` 用 `<Navigate replace state={{ from }}>` 重定向，登录成功后回到原地址

### 路由表

| 路径 | 组件 | 守卫 |
| --- | --- | --- |
| `/` `/blog` `/blog/:slug` | `SiteLayout` 下的页面 | 公开 |
| `/admin/login` | `Login` | 公开（已登录则跳后台） |
| `/admin` | `Dashboard` | 需登录 |
| `/admin/profile` | `ProfileAdmin` | 需登录 |
| `/admin/projects` | `ProjectsAdmin` | 需登录 |
| `*` | `NotFound` | 公开 |

## 5. 数据请求 Hook

`useAsyncData(loader, deps)` 统一处理加载 / 错误 / 重试：

- 重新请求时保留上一次 `data`，避免界面闪白
- 组件卸载后不再 `setState`（`alive` 标记）
- 返回 `{ data, loading, error, reload, setData }`，其中 `setData` 用于写操作后的本地乐观更新

`loader` 通过 `useRef` 读取，避免调用方每次渲染都传新函数导致重复请求。

## 6. 星空背景实现

`components/Starfield.tsx`，一个固定定位、`-z-10`、`pointer-events-none` 的容器 + 一张 Canvas：

1. **数量自适应**：`面积 × density`，并夹在 90-520 之间，小屏不稀疏、大屏不过载
2. **闪烁**：每颗星有独立相位与速度，透明度按正弦变化；约 30% 的星带冷色调
3. **视差**：鼠标位置经插值（`delta × 4`）后按星星深度加权位移；滚动按深度产生纵向漂移
4. **高分屏**：物理像素 = CSS 尺寸 × DPR（上限 2），再用 `setTransform` 归一化绘制坐标
5. **流星**：按 4.2-11s 随机间隔生成，用线性渐变画拖尾
6. **降级**：`prefers-reduced-motion: reduce` 时只绘制一帧静态星空，不启动 rAF 循环
7. **清理**：卸载时取消 rAF、断开 ResizeObserver、移除全局事件监听

## 7. 样式体系

`tailwind.config.js` 中定义语义化调色板，避免出现满屏 `slate-800`：

- `night.*` 夜幕色阶（950 最深 → 100 最亮），承载背景与文字层级
- `aurora.*` 主色（蓝），用于主按钮、链接、进度条
- `plasma.*` 辅助色（紫），用于标签与强调

`index.css` 用 `@layer components` 收敛高频组合（`.glass`、`.section-anchor`、`.text-gradient`），
并在 base 层统一处理滚动条、选区颜色、焦点环与 `prefers-reduced-motion`。

## 8. 切换到真实后端的路径

1. 在 `api/client.ts` 把 `request()` 内部的 handler 调用改为 `fetch`
2. 逐个替换各 api 模块的函数体（签名与返回类型不变）
3. 删除 `api/db.ts` 与 `data/seed.ts`
4. 业务代码、类型定义、`useAsyncData` 用法均无需改动

## 9. 已知边界

- 数据仅存在当前浏览器，换设备 / 清缓存即丢失
- 密码散列在前端完成，不具备真实安全性
- 未做并发写冲突处理（多标签页同时编辑可能互相覆盖）
