<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  value: number
  label: string
  class?: string
}>()
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="value"
    aria-valuemin="0"
    aria-valuemax="100"
    :class="cn('h-1.5 overflow-hidden rounded-full bg-bg-tertiary', props.class)"
  >
    <div
      class="h-full rounded-full bg-progress transition-[width] duration-700 ease-out"
      :style="{ width: `${value}%` }"
    />
  </div>
</template>
