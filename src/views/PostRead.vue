<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '../stores/posts'
import { useDraftsStore } from '../stores/drafts'
import { renderMarkdown } from '../lib/markdown'
import {
  branchExists,
  closePr,
  createBranch,
  deleteBranch,
  deleteFile,
  findOpenPrForBranch,
  mergePr,
  openPr
} from '../lib/github'
import ConfirmModal from '../components/ConfirmModal.vue'

const props = defineProps<{ postKey: string }>()
const posts = usePostsStore()
const drafts = useDraftsStore()
const router = useRouter()
const { items } = storeToRefs(posts)

const merging = ref(false)
const deleting = ref(false)
const actionError = ref<string | null>(null)
const confirmDeleteOpen = ref(false)

const post = computed(() => posts.byKey(props.postKey))
const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ''))
const draft = computed(() => drafts.get(props.postKey))

const deleteMessage = computed(() => {
  if (!post.value) return ''
  const title = post.value.frontmatter.friendly_title || post.value.slug || post.value.name
  if (post.value.draftOnly) {
    return `This will close the draft PR and delete branch "${draft.value?.branch ?? ''}".\n\n"${title}" has never been merged to ${post.value.path.split('/')[0]}, so nothing will be removed from the base branch.`
  }
  return `This will open a delete PR for "${title}" and merge it into the base branch.\n\nThe file at ${post.value.path} will be removed.`
})

onMounted(async () => {
  if (items.value.length === 0) await posts.load()
  const d = drafts.get(props.postKey)
  if (d && d.branch) {
    const prNumber = await findOpenPrForBranch(d.branch).catch(() => null)
    if (prNumber === null) drafts.remove(props.postKey)
    else if (prNumber !== d.prNumber) drafts.set(props.postKey, { ...d, prNumber })
  }
})

async function mergeDraftPr(): Promise<void> {
  const d = draft.value
  if (!d || !d.prNumber) return
  merging.value = true
  actionError.value = null
  try {
    await mergePr(d.prNumber)
    drafts.remove(props.postKey)
    posts.invalidate()
    await posts.load()
    router.push({ name: 'posts' })
  } catch (e) {
    actionError.value = (e as Error).message ?? 'Failed to merge PR'
  } finally {
    merging.value = false
  }
}

async function confirmDelete(): Promise<void> {
  const current = post.value
  if (!current) return
  deleting.value = true
  actionError.value = null
  try {
    if (current.draftOnly) {
      const d = drafts.get(props.postKey)
      if (d?.prNumber) {
        try { await closePr(d.prNumber) } catch { /* PR already closed */ }
      }
      if (d?.branch) {
        try { await deleteBranch(d.branch) } catch { /* branch already gone */ }
      }
      drafts.remove(props.postKey)
    } else {
      const title = current.frontmatter.friendly_title || current.slug || current.name
      const branch = `delete/${current.key}`
      if (!(await branchExists(branch))) await createBranch(branch)
      await deleteFile(branch, current.path, current.sha, `Delete: ${title}`)
      let prNumber = await findOpenPrForBranch(branch)
      if (!prNumber) {
        prNumber = await openPr(branch, `Delete: ${title}`, 'Opened by blog-author.')
      }
      await mergePr(prNumber)
      try { await deleteBranch(branch) } catch { /* branch auto-deleted by merge settings */ }
      drafts.remove(props.postKey)
    }
    posts.invalidate()
    confirmDeleteOpen.value = false
    router.push({ name: 'posts' })
  } catch (e) {
    actionError.value = (e as Error).message ?? 'Failed to delete post'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="stack">
    <div class="row" style="flex-wrap: wrap; gap: 0.5rem;">
      <RouterLink to="/posts" class="btn btn-ghost">&larr; Back</RouterLink>
      <div style="flex: 1;"></div>
      <RouterLink v-if="post" :to="{ name: 'edit', params: { postKey: props.postKey } }" class="btn">Edit</RouterLink>
      <button
        v-if="post"
        type="button"
        class="btn"
        style="background: #b02a2a; color: #fff; border-color: #b02a2a;"
        :disabled="deleting"
        @click="confirmDeleteOpen = true"
      >Delete</button>
      <button
        v-if="draft && draft.prNumber"
        class="btn btn-ok"
        type="button"
        :disabled="merging"
        @click="mergeDraftPr"
      >{{ merging ? 'Merging&hellip;' : 'Merge PR #' + draft.prNumber }}</button>
    </div>

    <p v-if="actionError" class="error">{{ actionError }}</p>

    <article v-if="post" class="card stack">
      <header class="stack" style="gap: 0.5rem;">
        <h1 style="margin: 0;">{{ post.frontmatter.friendly_title || post.slug || post.name }}</h1>
        <div class="row" style="gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <span v-if="post.date" class="muted" style="font-size: 0.9rem;">{{ post.date }}</span>
          <span
            class="badge"
            :class="post.frontmatter.visible ? 'badge-ok' : 'badge-warn'"
          >{{ post.frontmatter.visible ? 'visible' : 'hidden' }}</span>
          <span v-if="post.frontmatter.tags" class="badge">{{ post.frontmatter.tags }}</span>
          <span v-if="post.draftOnly" class="badge badge-warn">new draft</span>
        </div>
      </header>
      <div class="markdown-body" v-html="html"></div>
    </article>

    <p v-else class="muted">Post not found.</p>

    <ConfirmModal
      :open="confirmDeleteOpen"
      title="Delete this post?"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      :busy="deleting"
      @cancel="confirmDeleteOpen = false"
      @confirm="confirmDelete"
    />
  </section>
</template>

<style>
.markdown-body { line-height: 1.55; word-wrap: break-word; }
.markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 1.25rem; }
.markdown-body pre {
  background: #0b1220;
  border: 1px solid var(--border);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow: auto;
}
.markdown-body code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; }
.markdown-body img { max-width: 100%; height: auto; }
.markdown-body blockquote {
  border-left: 3px solid var(--border);
  padding-left: 0.75rem;
  color: var(--muted);
  margin: 0.75rem 0;
}
</style>
