<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { LibraryBook } from '@/types/library'
import { formatAuthors } from '@/lib/books'
import { relativeTime } from '@/lib/dates'
import BookCover from './BookCover.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const props = defineProps<{ book: LibraryBook }>()

const percent = computed(() => props.book.progress?.percent ?? 0)
/** Page position when we know the page count; percentage-only books show just the percent */
const pagePosition = computed(() => {
  const { progress, pageCount } = props.book
  return progress?.currentPage != null && pageCount
    ? `p. ${progress.currentPage} of ${pageCount}`
    : null
})
</script>

<template>
  <article
    class="relative flex gap-4 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
  >
    <BookCover
      :title="book.title"
      :author="book.authors[0]"
      :src="book.coverUrl"
      size="S"
      decorative
      class="w-16 shrink-0"
    />
    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="truncate font-heading text-base font-semibold">
        <RouterLink
          :to="{ name: 'book', params: { bookId: book.id } }"
          class="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
        >
          {{ book.title }}
        </RouterLink>
      </h3>
      <p class="truncate text-sm text-text-secondary">{{ formatAuthors(book.authors) }}</p>

      <div class="mt-auto pt-3">
        <div class="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
          <span class="font-medium tabular-nums">{{ pagePosition ?? `${percent}% read` }}</span>
          <span v-if="pagePosition" class="text-text-tertiary tabular-nums">{{ percent }}%</span>
        </div>
        <ProgressBar :value="percent" :label="`Reading progress for ${book.title}`" />
        <p v-if="book.progress" class="mt-1.5 text-xs text-text-tertiary">
          Updated {{ relativeTime(book.progress.updatedAt) }}
        </p>
      </div>
    </div>
  </article>
</template>
