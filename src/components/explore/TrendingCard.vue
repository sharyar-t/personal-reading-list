<script setup lang="ts">
import BookCover from '@/components/book/BookCover.vue'
import AddToShelfButton from '@/components/search/AddToShelfButton.vue'
import { formatAuthors } from '@/lib/books'
import type { SearchResult } from '@/services/openLibrary/normalize'

const props = defineProps<{ result: SearchResult; rank: number }>()
const book = props.result.metadata
</script>

<template>
  <article class="flex h-full flex-col gap-3">
    <div class="relative">
      <BookCover
        :title="book.title"
        :author="book.authors[0]"
        :src="book.coverUrl"
        decorative
        class="w-full"
      />
      <span
        class="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-bg-primary/90 text-xs font-bold text-text-primary tabular-nums shadow-sm"
        aria-hidden="true"
      >
        {{ rank }}
      </span>
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="font-heading leading-snug font-semibold">
        <span class="sr-only">#{{ rank }}: </span>{{ book.title }}
      </h3>
      <p class="truncate text-sm text-text-secondary">{{ formatAuthors(book.authors) }}</p>
      <p v-if="book.publishYear" class="text-xs text-text-tertiary">{{ book.publishYear }}</p>
    </div>
    <AddToShelfButton :result="result" class="[&>div]:items-start" />
  </article>
</template>
