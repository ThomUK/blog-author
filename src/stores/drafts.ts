import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'blog-author:drafts'

export interface DraftInfo {
  branch: string
  prNumber: number | null
  path: string
}

function load(): Record<string, DraftInfo> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, DraftInfo> } catch { return {} }
}

export const useDraftsStore = defineStore('drafts', () => {
  const map = ref<Record<string, DraftInfo>>(load())

  watch(map, (v) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  }, { deep: true })

  function set(slug: string, info: DraftInfo): void {
    map.value = { ...map.value, [slug]: info }
  }
  function get(slug: string): DraftInfo | undefined {
    return map.value[slug]
  }
  function remove(slug: string): void {
    const next = { ...map.value }
    delete next[slug]
    map.value = next
  }

  return { map, set, get, remove }
})
