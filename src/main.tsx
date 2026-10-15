import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { ensureSeeded } from '@/api'
import '@/index.css'

// 首次运行（或数据结构版本变化）时播种演示数据。
// 放在渲染之前同步执行，避免组件首屏读到空数据。
ensureSeeded()

const container = document.getElementById('root')

if (!container) {
  throw new Error('未找到 #root 挂载节点，请检查 index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
