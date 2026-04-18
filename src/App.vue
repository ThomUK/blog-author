<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { token, login } = storeToRefs(auth)

onMounted(async () => {
  await auth.init()
})

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="app-header">
    <RouterLink :to="token ? '/posts' : '/'" class="brand">Blog Author</RouterLink>
    <nav v-if="token" class="nav">
      <RouterLink to="/posts">Posts</RouterLink>
      <RouterLink to="/new">New</RouterLink>
    </nav>
    <div v-if="token" class="user">
      <span v-if="login" class="login">@{{ login }}</span>
      <button type="button" class="btn btn-ghost" @click="logout">Logout</button>
    </div>
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>
