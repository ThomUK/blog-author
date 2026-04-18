<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSettingsStore, type Settings } from '../stores/settings'
import { usePostsStore } from '../stores/posts'
import { useDraftsStore } from '../stores/drafts'

const settings = useSettingsStore()
const posts = usePostsStore()
const drafts = useDraftsStore()
const router = useRouter()
const route = useRoute()
const { validating, error, isConfigured, login } = storeToRefs(settings)

const form = reactive<Settings>({
  owner: settings.state.owner,
  repo: settings.state.repo,
  postsDir: settings.state.postsDir,
  baseBranch: settings.state.baseBranch || 'main',
  token: settings.state.token
})

const localError = ref<string | null>(null)

async function save(): Promise<void> {
  localError.value = null
  if (!form.owner || !form.repo || !form.postsDir || !form.token) {
    localError.value = 'Owner, repo, posts directory, and token are all required.'
    return
  }
  try {
    const repoChanged =
      form.owner !== settings.state.owner ||
      form.repo !== settings.state.repo ||
      form.postsDir !== settings.state.postsDir ||
      form.baseBranch !== settings.state.baseBranch
    await settings.save({ ...form })
    if (repoChanged) {
      posts.invalidate()
      drafts.clear()
    }
    const next = typeof route.query.next === 'string' ? route.query.next : '/posts'
    router.push(next)
  } catch {
    // Error already surfaced via settings.error
  }
}

function clearAll(): void {
  settings.clear()
  posts.invalidate()
  drafts.clear()
  form.owner = ''
  form.repo = ''
  form.postsDir = ''
  form.baseBranch = 'main'
  form.token = ''
}
</script>

<template>
  <section class="card stack">
    <h1>Settings</h1>
    <p class="muted">
      Point this app at any GitHub repo that stores blog posts as markdown files in a single directory.
      The token is stored in this browser's localStorage; anyone with access to this device can read it.
    </p>

    <form class="stack" @submit.prevent="save">
      <label class="stack" style="gap: 0.35rem;">
        <span class="muted">Repo owner (user or org)</span>
        <input class="input" type="text" autocomplete="off" spellcheck="false" v-model="form.owner" placeholder="octocat" />
      </label>
      <label class="stack" style="gap: 0.35rem;">
        <span class="muted">Repo name</span>
        <input class="input" type="text" autocomplete="off" spellcheck="false" v-model="form.repo" placeholder="my-blog" />
      </label>
      <label class="stack" style="gap: 0.35rem;">
        <span class="muted">Posts directory (path within the repo)</span>
        <input class="input" type="text" autocomplete="off" spellcheck="false" v-model="form.postsDir" placeholder="content/posts" />
      </label>
      <label class="stack" style="gap: 0.35rem;">
        <span class="muted">Base branch</span>
        <input class="input" type="text" autocomplete="off" spellcheck="false" v-model="form.baseBranch" placeholder="main" />
      </label>
      <label class="stack" style="gap: 0.35rem;">
        <span class="muted">Fine-grained PAT (Contents R/W, Pull requests R/W on target repo)</span>
        <input class="input" type="password" autocomplete="off" spellcheck="false" v-model="form.token" placeholder="github_pat_..." />
      </label>

      <div class="row">
        <button type="submit" class="btn" :disabled="validating">
          {{ validating ? 'Validating\u2026' : 'Save' }}
        </button>
        <button
          v-if="isConfigured"
          type="button"
          class="btn btn-ghost"
          @click="clearAll"
        >Clear all settings</button>
        <span v-if="login" class="muted" style="font-size: 0.85rem;">Signed in as @{{ login }}</span>
      </div>

      <p v-if="localError" class="error">{{ localError }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </section>
</template>
