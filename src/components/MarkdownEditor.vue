<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const host = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

onMounted(() => {
  if (!host.value) return
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme(
        {
          '&': {
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            minHeight: '50vh',
            fontSize: '16px'
          },
          '.cm-content': {
            padding: '0.75rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
          },
          '.cm-focused': { outline: 'none' },
          '&.cm-focused': { outline: '2px solid var(--accent)' },
          '.cm-scroller': { lineHeight: '1.5' }
        },
        { dark: true }
      ),
      EditorView.updateListener.of((v) => {
        if (v.docChanged) {
          const next = v.state.doc.toString()
          if (next !== props.modelValue) emit('update:modelValue', next)
        }
      })
    ]
  })
  view = new EditorView({ state, parent: host.value })
})

watch(
  () => props.modelValue,
  (next) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (next !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: next } })
    }
  }
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div ref="host" class="cm-host"></div>
</template>

<style>
.cm-host { width: 100%; }
.cm-editor { width: 100%; }
</style>
