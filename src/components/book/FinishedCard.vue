<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'
import { PartyPopper } from '@lucide/vue'
import type { LibraryBook } from '@/types/library'
import { useLibraryStore } from '@/stores/library'
import { daysBetween } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import StarRating from './StarRating.vue'

const props = defineProps<{ book: LibraryBook }>()
const emit = defineEmits<{ dismiss: []; finish: [] }>()

const library = useLibraryStore()
const heading = useTemplateRef<HTMLElement>('heading')

const summary = computed(() => {
  const { pageCount, startedAt } = props.book
  const days = startedAt ? daysBetween(startedAt) : null
  const pages = pageCount ? `${pageCount} pages` : 'Every page'
  return days ? `${pages} in ${days} ${days === 1 ? 'day' : 'days'}.` : `${pages}, done.`
})

const rating = computed({
  get: () => props.book.rating,
  set: (value) => library.setRating(props.book.id, value),
})

// The card replaces the progress controls the reader was using; if that took
// keyboard focus with it, move focus here instead of dropping it on <body>
onMounted(() => {
  const active = document.activeElement
  if (!active || active === document.body || !active.isConnected) heading.value?.focus()
})
</script>

<template>
  <section
    aria-labelledby="finished-heading"
    class="relative overflow-hidden rounded-xl border border-accent/30 bg-accent-subtle p-6 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in-0 motion-safe:zoom-in-95"
  >
    <PartyPopper
      class="absolute -top-3 -right-3 size-28 rotate-12 text-accent opacity-10"
      aria-hidden="true"
    />
    <div class="relative space-y-4">
      <div>
        <h2
          id="finished-heading"
          ref="heading"
          tabindex="-1"
          class="flex items-center gap-2 text-2xl font-bold"
        >
          <PartyPopper
            class="size-6 text-accent motion-safe:animate-in motion-safe:duration-500 motion-safe:zoom-in-50 motion-safe:spin-in-12"
            aria-hidden="true"
          />
          You finished {{ book.title }}!
        </h2>
        <p class="mt-1 text-text-secondary">{{ summary }}</p>
      </div>

      <StarRating v-model="rating" label="How was it?" />

      <div class="flex flex-wrap gap-3">
        <Button @click="emit('finish')">Move to Read</Button>
        <Button variant="ghost" @click="emit('dismiss')">Not yet</Button>
      </div>
    </div>
  </section>
</template>
