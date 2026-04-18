<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '../stores/posts'
import { useDraftsStore } from '../stores/drafts'
import { parseFrontmatter, serializeFrontmatter, slugify, type Frontmatter } from '../lib/frontmatter'
import { buildFilename, buildBranchName, todayIso } from '../lib/filename'
import {
  cfg,
  branchExists,
  createBranch,
  findOpenPrForBranch,
  openPr,
  putFile,
  readPost
} from '../lib/github'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import MarkdownPreview from '../components/MarkdownPreview.vue'
import MetaForm from '../components/MetaForm.vue'
import TabBar from '../components/TabBar.vue'
import SaveBar from '../components/SaveBar.vue'

const route = useRoute()
const router = useRouter()
const posts = usePostsStore()
const drafts = useDraftsStore()
const { items } = storeToRefs(posts)

const postKey = computed(() => (typeof route.params.postKey === 'string' ? route.params.postKey : null))
const isNew = computed(() => !postKey.value)

const tab = ref<'write' | 'preview' | 'meta'>('write')

const body = ref('')
const meta = reactive<Frontmatter>({
  friendly_title: '',
  tags: null,
  visible: false,
  summary: null
})

const currentSha = ref<string | null>(null)
const originalPath = ref<string | null>(null)
const originalDate = ref<string | null>(null)
const originalSlug = ref<string | null>(null)

const saving = ref(false)
const saveError = ref<string | null>(null)
const saveMessage = ref<string | null>(null)
const loading = ref(false)

const derivedSlug = computed(() => slugify(String(meta.friendly_title ?? '')) || (originalSlug.value ?? ''))
const derivedDate = computed(() => originalDate.value ?? todayIso())
const derivedFilename = computed(() =>
  derivedSlug.value ? buildFilename(derivedDate.value, derivedSlug.value) : ''
)
const derivedPath = computed(() =>
  derivedFilename.value ? `${cfg().postsDir}/${derivedFilename.value}` : ''
)
const derivedKey = computed(() =>
  derivedFilename.value ? derivedFilename.value.replace(/\.md$/, '') : ''
)

onMounted(async () => {
  if (isNew.value) return
  loading.value = true
  try {
    if (items.value.length === 0) await posts.load()
    const existing = posts.byKey(postKey.value!)
    if (!existing) throw new Error('Post not found')

    const draft = drafts.get(postKey.value!)
    let fresh
    if (draft?.branch) {
      try {
        fresh = await readPost(existing.path, draft.branch)
      } catch {
        if (existing.draftOnly) throw new Error('Draft branch no longer has this file.')
        fresh = await readPost(existing.path)
      }
    } else {
      fresh = await readPost(existing.path)
    }

    const { data, content } = parseFrontmatter(fresh.content)
    body.value = content.replace(/^\n/, '')
    Object.assign(meta, {
      friendly_title: data.friendly_title ?? '',
      tags: data.tags ?? null,
      visible: data.visible ?? false,
      summary: data.summary ?? null
    })
    currentSha.value = fresh.sha
    originalPath.value = fresh.path
    originalDate.value = existing.date
    originalSlug.value = existing.slug
  } catch (e) {
    saveError.value = (e as Error).message ?? 'Failed to load post'
  } finally {
    loading.value = false
  }
})

watch(saveMessage, (v) => {
  if (!v) return
  const t = setTimeout(() => (saveMessage.value = null), 4000)
  return () => clearTimeout(t)
})

async function save(): Promise<void> {
  saveError.value = null
  saveMessage.value = null
  if (!meta.friendly_title || !String(meta.friendly_title).trim()) {
    saveError.value = 'A title is required to derive a slug.'
    tab.value = 'meta'
    return
  }
  if (!body.value.trim()) {
    saveError.value = 'Post body is empty.'
    tab.value = 'write'
    return
  }
  saving.value = true
  try {
    const slug = derivedSlug.value
    const date = derivedDate.value
    const path = derivedPath.value
    const key = derivedKey.value

    const existingDraft = drafts.get(key)
    let branch: string
    let branchIsNew = false
    if (existingDraft) {
      branch = existingDraft.branch
      if (!(await branchExists(branch))) {
        await createBranch(branch)
        branchIsNew = true
      }
    } else {
      const prefix: 'post' | 'edit' = isNew.value ? 'post' : 'edit'
      branch = buildBranchName(prefix, date, slug)
      if (!(await branchExists(branch))) {
        await createBranch(branch)
        branchIsNew = true
      }
    }

    // Pick the sha to submit with the PUT.
    // - Authoritative: currentSha.value, updated after every successful put.
    // - On a brand-new branch we just created from base, the file's blob sha
    //   there matches whatever we have from the base read (currentSha).
    // - For a pre-existing draft branch we haven't read from in this session
    //   (e.g. resumed from localStorage), fall back to a fresh read.
    let sha: string | undefined = currentSha.value ?? undefined
    if (!sha && !branchIsNew && !isNew.value) {
      try {
        const fresh = await readPost(path, branch)
        sha = fresh.sha
      } catch {
        sha = undefined
      }
    }

    const file = serializeFrontmatter({ ...meta }, body.value)
    const message = isNew.value
      ? `Draft: ${meta.friendly_title}`
      : `Edit: ${meta.friendly_title}`
    const put = await putFile(branch, path, file, message, sha)
    currentSha.value = put.sha

    let prNumber = existingDraft?.prNumber ?? (await findOpenPrForBranch(branch))
    if (!prNumber) {
      prNumber = await openPr(branch, `Draft: ${meta.friendly_title}`, 'Opened by blog-author.')
    }

    drafts.set(key, { branch, prNumber, path })
    posts.invalidate()

    saveMessage.value = `Saved. PR #${prNumber} on branch ${branch}.`
    if (isNew.value) {
      router.replace({ name: 'edit', params: { postKey: key } })
    }
  } catch (e) {
    saveError.value = (e as Error).message ?? 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="stack">
    <div class="row">
      <button type="button" class="btn btn-ghost" @click="router.back()">&larr; Back</button>
      <h1 style="margin: 0; flex: 1;">{{ isNew ? 'New post' : 'Edit post' }}</h1>
    </div>

    <TabBar
      :tabs="[
        { id: 'write', label: 'Write' },
        { id: 'preview', label: 'Preview' },
        { id: 'meta', label: 'Meta' }
      ]"
      :active="tab"
      @change="(id: string) => (tab = id as 'write' | 'preview' | 'meta')"
    />

    <p v-if="loading" class="muted">Loading&hellip;</p>

    <MarkdownEditor v-show="tab === 'write'" v-model="body" />
    <MarkdownPreview v-if="tab === 'preview'" :source="body" />
    <MetaForm
      v-if="tab === 'meta'"
      :meta="meta"
      :filename="derivedFilename"
      @update="(next) => Object.assign(meta, next)"
    />

    <SaveBar
      :saving="saving"
      :error="saveError"
      :message="saveMessage"
      @save="save"
    />
  </section>
</template>
