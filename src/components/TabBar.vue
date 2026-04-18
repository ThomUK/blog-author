<script setup lang="ts">
defineProps<{
  tabs: { id: string; label: string }[]
  active: string
}>()
const emit = defineEmits<{ (e: 'change', id: string): void }>()
</script>

<template>
  <div class="tabbar" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.id"
      type="button"
      role="tab"
      :aria-selected="active === t.id"
      :class="['tab', { 'tab-active': active === t.id }]"
      @click="emit('change', t.id)"
    >{{ t.label }}</button>
  </div>
</template>

<style scoped>
.tabbar {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--panel);
}
.tab {
  flex: 1;
  background: transparent;
  color: var(--muted);
  border: none;
  padding: 0.55rem 0.5rem;
  font: inherit;
  cursor: pointer;
}
.tab-active {
  background: var(--panel-2);
  color: var(--text);
}
.tab + .tab { border-left: 1px solid var(--border); }
</style>
