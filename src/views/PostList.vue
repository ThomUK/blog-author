<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { usePostsStore } from '../stores/posts'
import { useDraftsStore } from '../stores/drafts'

const posts = usePostsStore()
const drafts = useDraftsStore()
const { items, loading, error } = storeToRefs(posts)

onMounted(() => {
  if (items.value.length === 0) void posts.load()
})
</script>

<template>
  <section class="stack">
    <div class="row">
      <h1 style="margin: 0; flex: 1;">Posts</h1>
      <button class="btn btn-ghost" type="button" :disabled="loading" @click="posts.load()">
        {{ loading ? 'Loading&hellip;' : 'Refresh' }}
      </button>
      <RouterLink to="/new" class="btn">New post</RouterLink>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <p v-if="!loading && items.length === 0" class="muted">No posts found.</p>

    <ul class="stack" style="list-style: none; padding: 0;">
      <li v-for="p in items" :key="p.path" class="card">
        <RouterLink :to="{ name: 'read', params: { postKey: p.key } }" style="color: var(--text); text-decoration: none;">
          <div class="row" style="justify-content: space-between;">
            <strong>{{ p.frontmatter.friendly_title || p.slug || p.name }}</strong>
            <span class="muted" style="font-size: 0.85rem;">{{ p.date ?? '' }}</span>
          </div>
          <div class="row" style="margin-top: 0.35rem;">
            <span
              class="badge"
              :class="p.frontmatter.visible ? 'badge-ok' : 'badge-warn'"
            >{{ p.frontmatter.visible ? 'visible' : 'hidden' }}</span>
            <span v-if="p.frontmatter.tags" class="badge">{{ p.frontmatter.tags }}</span>
            <span v-if="drafts.get(p.key)" class="badge badge-warn">draft PR open</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
