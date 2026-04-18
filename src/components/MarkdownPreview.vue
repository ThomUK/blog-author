<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../lib/markdown'

const props = defineProps<{ source: string }>()
const html = computed(() => renderMarkdown(props.source || '*Nothing to preview yet.*'))
</script>

<template>
  <article class="card markdown-body" v-html="html"></article>
</template>
