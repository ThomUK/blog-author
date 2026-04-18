import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Octokit } from '@octokit/rest'

const STORAGE_KEY = 'blog-author:settings'
const LEGACY_PAT_KEY = 'blog-author:pat'

export interface Settings {
  owner: string
  repo: string
  postsDir: string
  baseBranch: string
  token: string
}

const defaults: Settings = {
  owner: '',
  repo: '',
  postsDir: '',
  baseBranch: 'main',
  token: ''
}

function load(): Settings {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return { ...defaults, ...(JSON.parse(raw) as Partial<Settings>) }
    } catch {
      /* fall through */
    }
  }
  const legacyToken = localStorage.getItem(LEGACY_PAT_KEY)
  return { ...defaults, token: legacyToken ?? '' }
}

export const useSettingsStore = defineStore('settings', () => {
  const state = ref<Settings>(load())
  const login = ref<string | null>(null)
  const error = ref<string | null>(null)
  const validating = ref(false)

  watch(
    state,
    (v) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    },
    { deep: true }
  )

  const isConfigured = computed(() =>
    Boolean(
      state.value.owner &&
        state.value.repo &&
        state.value.postsDir &&
        state.value.token
    )
  )

  async function save(next: Settings): Promise<void> {
    error.value = null
    validating.value = true
    try {
      const octokit = new Octokit({ auth: next.token })
      const me = await octokit.rest.users.getAuthenticated()
      login.value = me.data.login
      await octokit.rest.repos.getContent({
        owner: next.owner,
        repo: next.repo,
        path: next.postsDir,
        ref: next.baseBranch || 'main'
      })
      state.value = { ...next, baseBranch: next.baseBranch || 'main' }
    } catch (e) {
      error.value = (e as Error).message ?? 'Validation failed'
      throw e
    } finally {
      validating.value = false
    }
  }

  async function init(): Promise<void> {
    if (!state.value.token || login.value) return
    try {
      const octokit = new Octokit({ auth: state.value.token })
      const me = await octokit.rest.users.getAuthenticated()
      login.value = me.data.login
    } catch {
      login.value = null
    }
  }

  function clear(): void {
    state.value = { ...defaults }
    login.value = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_PAT_KEY)
  }

  return { state, login, error, validating, isConfigured, save, init, clear }
})
