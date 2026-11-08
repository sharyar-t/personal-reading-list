<script setup lang="ts">
import { computed } from 'vue'
import type { GenreStat } from '@/lib/stats'

const props = defineProps<{ genres: GenreStat[]; limit?: number }>()

const shown = computed(() => {
  const list = props.genres.slice(0, props.limit ?? 6)
  const top = list[0]?.count ?? 1
  return list.map((genre) => ({ ...genre, width: Math.round((genre.count / top) * 100) }))
})
const hidden = computed(() => props.genres.length - shown.value.length)
</script>

<template>
  <div>
    <ul role="list" class="space-y-3">
      <li v-for="genre in shown" :key="genre.name">
        <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
          <span class="font-medium">{{ genre.name }}</span>
          <span class="text-text-secondary tabular-nums">
            {{ genre.count }} {{ genre.count === 1 ? 'book' : 'books' }}
          </span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-bg-tertiary" aria-hidden="true">
          <div
            class="h-full rounded-full bg-progress transition-[width] duration-700 ease-out"
            :style="{ width: `${genre.width}%` }"
          />
        </div>
      </li>
    </ul>
    <p v-if="hidden > 0" class="mt-4 text-sm text-text-tertiary">
      and {{ hidden }} more {{ hidden === 1 ? 'genre' : 'genres' }}
    </p>
  </div>
</template>
