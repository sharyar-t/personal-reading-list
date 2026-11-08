<script setup lang="ts">
import { computed } from 'vue'
import type { GoalProgress } from '@/lib/goal'

const props = defineProps<{ progress: GoalProgress }>()

const SIZE = 220
const STROKE = 16
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

const offset = computed(() => C * (1 - props.progress.percent / 100))
const complete = computed(() => props.progress.status === 'complete')

/** Tick showing where a steady reader would be today */
const marker = computed(() => {
  const share = Math.min(1, props.progress.expected / props.progress.target)
  if (complete.value || share <= 0 || share >= 1) return null
  const angle = share * 2 * Math.PI - Math.PI / 2
  const inner = R - STROKE / 2 - 3
  const outer = R + STROKE / 2 + 3
  const mid = SIZE / 2
  return {
    x1: mid + inner * Math.cos(angle),
    y1: mid + inner * Math.sin(angle),
    x2: mid + outer * Math.cos(angle),
    y2: mid + outer * Math.sin(angle),
  }
})
</script>

<template>
  <div class="relative mx-auto aspect-square w-full max-w-56">
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="size-full -rotate-90" aria-hidden="true">
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="R"
        fill="none"
        :stroke-width="STROKE"
        class="stroke-bg-tertiary"
      />
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="R"
        fill="none"
        :stroke-width="STROKE"
        stroke-linecap="round"
        :stroke-dasharray="C"
        :stroke-dashoffset="offset"
        class="transition-[stroke-dashoffset] duration-1000 ease-out"
        :class="complete ? 'stroke-success' : 'stroke-progress'"
      />
      <line
        v-if="marker"
        v-bind="marker"
        stroke-width="3"
        stroke-linecap="round"
        class="stroke-text-primary"
      />
    </svg>
    <div
      class="absolute inset-0 flex flex-col items-center justify-center"
      role="img"
      :aria-label="`${progress.read} of ${progress.target} books read, ${progress.percent} percent`"
    >
      <span class="font-heading text-5xl font-bold tabular-nums" aria-hidden="true">
        {{ progress.read }}
      </span>
      <span class="text-sm text-text-secondary" aria-hidden="true">
        of {{ progress.target }} books
      </span>
    </div>
  </div>
</template>
