<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

withDefaults(defineProps<{ to?: RouteLocationRaw; compact?: boolean }>(), {
  to: '/',
  compact: false,
})
</script>

<template>
  <RouterLink
    :to="to"
    class="inline-flex items-center gap-2.5 rounded-md font-heading text-lg font-bold text-text-primary"
  >
    <img src="/favicon.svg" alt="" class="size-8" width="32" height="32" />
    <span :class="compact && 'sr-only'">Bookshelf</span>
  </RouterLink>
</template>
