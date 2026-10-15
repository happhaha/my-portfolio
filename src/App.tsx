import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '@/components/ProtectedRoute'
import SiteLayout from '@/components/SiteLayout'
import Starfield from '@/components/Starfield'
import { AuthProvider } from '@/context/AuthContext'
import BlogList from '@/pages/BlogList'
import BlogPost from '@/pages/BlogPost'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import AdminLayout from '@/components/admin/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import Login from '@/pages/admin/Login'
import ProfileAdmin from '@/pages/admin/Profile'
import ProjectsAdmin from '@/pages/admin/Projects'

/**
 * 应用路由表。
 *
 * 结构：
 * /                      前台首页（Hero / 个人介绍 / 技能 / 项目 / 博客列表）
 * /blog                  博客列表
 * /blog/:slug            博客详情
 * /admin/login           后台登录（公开）
 * /admin                 仪表盘      —— 受 ProtectedRoute 保护
 * /admin/profile         个人信息管理 —— 受保护
 * /admin/projects        项目管理     —— 受保护
 * *                      404
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* 星空背景固定在所有页面之下 */}
        <Starfield />

        <Routes>
          {/* 前台 */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Route>

          {/* 后台登录页：公开 */}
          <Route path="/admin/login" element={<Login />} />

          {/* 后台：受路由守卫保护 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<ProfileAdmin />} />
            <Route path="projects" element={<ProjectsAdmin />} />
          </Route>

          {/* 兼容 /admin/ 结尾的写法 */}
          <Route path="/admin/" element={<Navigate to="/admin" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
