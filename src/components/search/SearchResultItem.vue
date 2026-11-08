<script setup lang="ts">
import { computed } from 'vue'
import BookCover from '@/components/book/BookCover.vue'
import AddToShelfButton from './AddToShelfButton.vue'
import { formatAuthors } from '@/lib/books'
import type { SearchResult } from '@/services/openLibrary/normalize'

const props = defineProps<{ result: SearchResult }>()

const book = computed(() => props.result.metadata)
const details = computed(() =>
  [
    book.value.publishYear && `First published ${book.value.publishYear}`,
    book.value.pageCount && `${book.value.pageCount} pages`,
    props.result.editionCount > 1 && `${props.result.editionCount} editions`,
  ].filter(Boolean),
)
</script>

<template>
  <article class="flex gap-4 py-5 sm:gap-5">
    <BookCover
      :title="book.title"
      :author="book.authors[0]"
      :src="book.coverUrl"
      decorative
      class="w-16 shrink-0 self-start sm:w-20"
    />

    <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="font-heading text-lg leading-snug font-semibold">
          {{ book.title }}
          <span
            v-if="book.subtitle"
            class="block font-sans text-sm font-normal text-text-secondary"
          >
            {{ book.subtitle }}
          </span>
        </h2>
        <p class="mt-1 text-text-secondary">{{ formatAuthors(book.authors) }}</p>
        <p v-if="details.length" class="mt-1 text-sm text-text-tertiary">
          {{ details.join(' · ') }}
        </p>
      </div>

      <AddToShelfButton :result="result" class="shrink-0" />
    </div>
  </article>
</template>
