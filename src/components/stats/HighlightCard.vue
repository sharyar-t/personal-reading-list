<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BookCover from '@/components/book/BookCover.vue'
import { formatAuthors } from '@/lib/books'
import type { LibraryBook } from '@/types/library'

defineProps<{
  label: string
  book: LibraryBook
  /** e.g. "612 pages" */
  detail?: string
}>()
</script>

<template>
  <RouterLink
    :to="{ name: 'book', params: { bookId: book.id } }"
    class="group flex items-center gap-4 rounded-lg border border-border-subtle bg-surface p-3 shadow-sm transition-colors hover:border-border hover:bg-bg-secondary"
  >
    <BookCover
      :title="book.title"
      :src="book.coverUrl"
      size="S"
      decorative
      class="w-14 shrink-0 rounded-sm"
    />
    <div class="min-w-0">
      <p class="text-xs font-medium tracking-wide text-accent uppercase">{{ label }}</p>
      <p class="mt-0.5 truncate font-heading font-semibold group-hover:text-accent">
        {{ book.title }}
      </p>
      <p class="truncate text-sm text-text-secondary">{{ formatAuthors(book.authors) }}</p>
      <p v-if="detail" class="mt-0.5 text-sm text-text-tertiary tabular-nums">{{ detail }}</p>
    </div>
  </RouterLink>
</template>
