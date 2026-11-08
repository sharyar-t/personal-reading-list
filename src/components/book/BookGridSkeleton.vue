<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 12 })
</script>

<template>
  <div
    class="grid grid-cols-[repeat(auto-fill,minmax(min(8.5rem,40vw),1fr))] gap-x-5 gap-y-8 sm:gap-x-6"
    aria-hidden="true"
  >
    <div v-for="n in count" :key="n" class="flex animate-pulse flex-col gap-3">
      <div class="aspect-2/3 rounded-sm bg-bg-tertiary" />
      <div class="h-3.5 w-4/5 rounded bg-bg-tertiary" />
      <div class="h-3 w-1/2 rounded bg-bg-tertiary" />
    </div>
  </div>
</template>
