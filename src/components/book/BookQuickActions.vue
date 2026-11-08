<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink } from '@lucide/vue'
import type { LibraryBook } from '@/types/library'
import { useLibraryStore } from '@/stores/library'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { openLibraryUrl } from '@/lib/books'
import ShelfSelect from './ShelfSelect.vue'
import StarRating from './StarRating.vue'

const props = defineProps<{
  book: LibraryBook
  /** Unique per instance — the page renders one for mobile and one for desktop */
  idPrefix: string
}>()

const library = useLibraryStore()
const { announce } = useAnnouncer()

const shelfId = computed({
  get: () => props.book.shelfId,
  set: async (next) => {
    if (next === props.book.shelfId) return
    const title = props.book.title
    await library.moveBook(props.book.id, next)
    announce(`Moved ${title} to ${library.getShelf(next)?.name}`)
  },
})

const rating = computed({
  get: () => props.book.rating,
  set: (value) => {
    library.setRating(props.book.id, value)
    announce(value ? `Rated ${value} out of 5` : 'Rating cleared')
  },
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="space-y-1.5">
      <label :for="`${idPrefix}-shelf`" class="text-sm font-medium text-text-secondary">
        Shelf
      </label>
      <ShelfSelect :id="`${idPrefix}-shelf`" v-model="shelfId" />
    </div>

    <StarRating v-model="rating" />

    <a
      :href="openLibraryUrl(book)"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 self-start text-sm font-medium text-accent hover:text-accent-hover"
    >
      View on Open Library
      <ExternalLink class="size-4" aria-hidden="true" />
      <span class="sr-only">(opens in a new tab)</span>
    </a>
  </div>
</template>
