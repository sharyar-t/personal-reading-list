<script setup lang="ts">
import type { LibraryBook } from '@/types/library'
import BookCard from './BookCard.vue'

const EAGER_COUNT = 4

defineProps<{
  books: LibraryBook[]
  showProgress?: boolean
}>()
</script>

<template>
  <ul
    role="list"
    class="grid grid-cols-[repeat(auto-fill,minmax(min(8.5rem,40vw),1fr))] gap-x-5 gap-y-8 sm:gap-x-6"
  >
    <!-- The first row is above the fold: don't lazy-load it (it is the page's LCP) -->
    <li v-for="(book, index) in books" :key="book.id">
      <BookCard :book="book" :show-progress="showProgress" :eager="index < EAGER_COUNT" />
    </li>
  </ul>
</template>
