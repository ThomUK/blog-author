import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Octokit } from '@octokit/rest'

const STORAGE_KEY = 'blog-author:pat'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const login = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function setToken(t: string): Promise<void> {
    error.value = null
    try {
      const octokit = new Octokit({ auth: t })
      const { data } = await octokit.rest.users.getAuthenticated()
      token.value = t
      login.value = data.login
      localStorage.setItem(STORAGE_KEY, t)
    } catch (e) {
      error.value = (e as Error).message ?? 'Failed to authenticate'
      throw e
    }
  }

  function logout(): void {
    token.value = null
    login.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  async function init(): Promise<void> {
    if (!token.value || login.value) return
    try {
      const octokit = new Octokit({ auth: token.value })
      const { data } = await octokit.rest.users.getAuthenticated()
      login.value = data.login
    } catch {
      logout()
    }
  }

  return { token, login, error, setToken, logout, init }
})
