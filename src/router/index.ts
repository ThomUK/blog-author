import { createRouter, createWebHashHistory } from 'vue-router'
import { useSettingsStore } from '../stores/settings'

const routes = [
  { path: '/', redirect: '/posts' },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') },
  { path: '/posts', name: 'posts', component: () => import('../views/PostList.vue'), meta: { requiresConfig: true } },
  { path: '/posts/:slug', name: 'read', component: () => import('../views/PostRead.vue'), meta: { requiresConfig: true }, props: true },
  { path: '/posts/:slug/edit', name: 'edit', component: () => import('../views/PostEdit.vue'), meta: { requiresConfig: true }, props: true },
  { path: '/new', name: 'new', component: () => import('../views/PostEdit.vue'), meta: { requiresConfig: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const settings = useSettingsStore()
  if (to.meta.requiresConfig && !settings.isConfigured) {
    return { name: 'settings', query: { next: to.fullPath } }
  }
})

export default router
