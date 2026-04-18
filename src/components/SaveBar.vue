<script setup lang="ts">
defineProps<{
  saving: boolean
  error: string | null
  message: string | null
}>()
const emit = defineEmits<{ (e: 'save'): void }>()
</script>

<template>
  <div class="savebar">
    <div class="savebar-inner">
      <p v-if="error" class="error" style="margin: 0; flex: 1;">{{ error }}</p>
      <p v-else-if="message" class="ok" style="margin: 0; flex: 1;">{{ message }}</p>
      <span v-else style="flex: 1;"></span>
      <button
        class="btn"
        type="button"
        :disabled="saving"
        @click="emit('save')"
      >{{ saving ? 'Saving\u2026' : 'Save draft' }}</button>
    </div>
  </div>
</template>

<style scoped>
.savebar {
  position: sticky;
  bottom: 0;
  margin: 0 -1rem -1rem;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: var(--panel);
  border-top: 1px solid var(--border);
  z-index: 4;
}
.savebar-inner {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
}
</style>
