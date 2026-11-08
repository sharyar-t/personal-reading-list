<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description: string
}>()
</script>

<template>
  <section
    class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-bg-secondary/60 px-6 py-14 text-center"
  >
    <span class="grid size-14 place-items-center rounded-full bg-accent-subtle text-accent">
      <component :is="icon" class="size-6" aria-hidden="true" />
    </span>
    <h2 class="text-xl font-semibold">{{ title }}</h2>
    <p class="max-w-sm text-text-secondary">{{ description }}</p>
    <div v-if="$slots.default" class="mt-2">
      <slot />
    </div>
  </section>
</template>
