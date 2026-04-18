<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const token = ref('')
const submitting = ref(false)
const localError = ref<string | null>(null)

async function submit(): Promise<void> {
  if (!token.value.trim()) return
  submitting.value = true
  localError.value = null
  try {
    await auth.setToken(token.value.trim())
    const next = typeof route.query.next === 'string' ? route.query.next : '/posts'
    router.push(next)
  } catch (e) {
    localError.value = (e as Error).message ?? 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card stack">
    <h1>Sign in</h1>
    <p class="muted">
      Paste a GitHub fine-grained Personal Access Token scoped to
      <code>ThomUK/blog_posts</code> with <em>Contents: Read &amp; Write</em> and
      <em>Pull requests: Read &amp; Write</em>.
    </p>
    <p class="warn">
      The token is stored in this browser's localStorage. Anyone with access to
      this device can read it. Revoke the token when you are done.
    </p>
    <form class="stack" @submit.prevent="submit">
      <input
        class="input"
        type="password"
        autocomplete="off"
        spellcheck="false"
        placeholder="github_pat_..."
        v-model="token"
        :disabled="submitting"
      />
      <div class="row">
        <button class="btn" type="submit" :disabled="submitting || !token.trim()">
          {{ submitting ? 'Checking\u2026' : 'Sign in' }}
        </button>
      </div>
      <p v-if="localError" class="error">{{ localError }}</p>
    </form>
  </section>
</template>
