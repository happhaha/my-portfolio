/**
 * API 层统一出口。
 *
 * 业务代码统一从 `@/api` 引入，不直接依赖 localStorage，
 * 将来接入真实后端时只需替换各模块内部实现。
 *
 * 命名约定：
 * - 读取使用 `fetchXxx`
 * - 写入使用 `createXxx` / `updateXxx` / `deleteXxx`
 */

export { ApiError, request, assert, toErrorMessage } from './client'
export { ensureSeeded, resetToSeed } from './db'

export {
  changePassword,
  fetchCurrentUser,
  getSession,
  login,
  logout,
  register,
} from './auth'

export {
  createSkill,
  deleteSkill,
  fetchProfile,
  fetchSkills,
  replaceSkills,
  updateProfile,
  updateSkill,
  type ProfileUpdate,
  type SkillInput,
} from './profile'

export {
  createProject,
  deleteProject,
  fetchProject,
  fetchProjects,
  moveProject,
  toggleProjectFeatured,
  updateProject,
  type ProjectQuery,
} from './projects'

export {
  createPost,
  deletePost,
  fetchPostBySlug,
  fetchPostTags,
  fetchPosts,
  fetchRelatedPosts,
  updatePost,
} from './posts'
