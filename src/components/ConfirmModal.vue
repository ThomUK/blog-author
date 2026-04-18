<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  danger?: boolean
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    @click.self="emit('cancel')"
  >
    <div class="modal card stack">
      <h2 style="margin: 0; font-size: 1.15rem;">{{ title }}</h2>
      <p style="margin: 0; white-space: pre-line;">{{ message }}</p>
      <div class="row" style="justify-content: flex-end; gap: 0.5rem;">
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="busy"
          @click="emit('cancel')"
        >Cancel</button>
        <button
          type="button"
          class="btn"
          :style="danger ? 'background: #b02a2a; color: #fff; border-color: #b02a2a;' : ''"
          :disabled="busy"
          @click="emit('confirm')"
        >{{ busy ? 'Working&hellip;' : (confirmLabel ?? 'Confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<style>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}
.modal {
  max-width: 28rem;
  width: 100%;
}
</style>
