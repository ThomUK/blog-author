<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from './stores/settings'

const settings = useSettingsStore()
const { login, isConfigured } = storeToRefs(settings)

onMounted(async () => {
  await settings.init()
})
</script>

<template>
  <header class="app-header">
    <RouterLink :to="isConfigured ? '/posts' : '/settings'" class="brand">Blog Author</RouterLink>
    <nav v-if="isConfigured" class="nav">
      <RouterLink to="/posts">Posts</RouterLink>
      <RouterLink to="/new">New</RouterLink>
    </nav>
    <div class="user">
      <span v-if="login" class="login">@{{ login }}</span>
      <RouterLink to="/settings" class="btn btn-ghost">Settings</RouterLink>
    </div>
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>
