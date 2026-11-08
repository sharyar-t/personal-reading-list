<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import AppLogo from '@/components/layout/AppLogo.vue'
</script>

<template>
  <main class="grid min-h-dvh place-items-center px-6 py-16 text-center">
    <div class="flex max-w-md flex-col items-center gap-5">
      <AppLogo />
      <p class="font-heading text-6xl font-bold text-accent">404</p>
      <h1 class="text-2xl font-bold">This page is missing from the shelf</h1>
      <p class="text-text-secondary">
        The link may be broken, or the page may have been moved. Let's get you back to your books.
      </p>
      <Button as-child>
        <RouterLink to="/library">Go to my library</RouterLink>
      </Button>
    </div>
  </main>
</template>
