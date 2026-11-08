<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { LibraryBook } from '@/types/library'
import { formatAuthors } from '@/lib/books'
import BookCover from './BookCover.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

defineProps<{
  book: LibraryBook
  /** Show the reading progress bar under the cover */
  showProgress?: boolean
}>()
</script>

<template>
  <article class="group relative flex flex-col gap-3">
    <BookCover
      :title="book.title"
      :author="book.authors[0]"
      :src="book.coverUrl"
      decorative
      class="transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
    />
    <ProgressBar
      v-if="showProgress && book.progress"
      :value="book.progress.percent"
      :label="`Reading progress for ${book.title}`"
      class="-mt-1"
    />
    <div class="min-w-0">
      <h3 class="line-clamp-2 font-sans text-sm leading-snug font-medium">
        <!-- Stretched link: the whole card is clickable, but only the title is announced -->
        <RouterLink
          :to="{ name: 'book', params: { bookId: book.id } }"
          class="after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
        >
          {{ book.title }}
        </RouterLink>
      </h3>
      <p class="mt-0.5 truncate text-sm text-text-secondary">{{ formatAuthors(book.authors) }}</p>
    </div>
  </article>
</template>
