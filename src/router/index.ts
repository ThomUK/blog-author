import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/posts', name: 'posts', component: () => import('../views/PostList.vue'), meta: { auth: true } },
  { path: '/posts/:slug', name: 'read', component: () => import('../views/PostRead.vue'), meta: { auth: true }, props: true },
  { path: '/posts/:slug/edit', name: 'edit', component: () => import('../views/PostEdit.vue'), meta: { auth: true }, props: true },
  { path: '/new', name: 'new', component: () => import('../views/PostEdit.vue'), meta: { auth: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.token) return { name: 'login', query: { next: to.fullPath } }
  if (to.name === 'login' && auth.token) return { name: 'posts' }
})

export default router
