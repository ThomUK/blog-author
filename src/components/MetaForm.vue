<script setup lang="ts">
import type { Frontmatter } from '../lib/frontmatter'

const props = defineProps<{ meta: Frontmatter; filename: string }>()
const emit = defineEmits<{ (e: 'update', patch: Partial<Frontmatter>): void }>()

function update<K extends keyof Frontmatter>(key: K, value: Frontmatter[K]): void {
  emit('update', { [key]: value } as Partial<Frontmatter>)
}
</script>

<template>
  <form class="card stack" @submit.prevent>
    <label class="stack" style="gap: 0.35rem;">
      <span class="muted">Title</span>
      <input
        class="input"
        type="text"
        :value="props.meta.friendly_title ?? ''"
        @input="update('friendly_title', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <label class="stack" style="gap: 0.35rem;">
      <span class="muted">Tags (comma-separated)</span>
      <input
        class="input"
        type="text"
        :value="props.meta.tags ?? ''"
        @input="update('tags', ($event.target as HTMLInputElement).value || null)"
      />
    </label>
    <label class="stack" style="gap: 0.35rem;">
      <span class="muted">Summary</span>
      <input
        class="input"
        type="text"
        :value="props.meta.summary ?? ''"
        @input="update('summary', ($event.target as HTMLInputElement).value || null)"
      />
    </label>
    <label class="row">
      <input
        type="checkbox"
        :checked="!!props.meta.visible"
        @change="update('visible', ($event.target as HTMLInputElement).checked)"
      />
      <span>Visible (publish on public site after merge)</span>
    </label>
    <div class="muted" style="font-size: 0.85rem;">
      Filename: <code>{{ props.filename || '\u2014' }}</code>
    </div>
  </form>
</template>
