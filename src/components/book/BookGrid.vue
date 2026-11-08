<script setup lang="ts">
import type { LibraryBook } from '@/types/library'
import BookCard from './BookCard.vue'

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
    <li v-for="book in books" :key="book.id">
      <BookCard :book="book" :show-progress="showProgress" />
    </li>
  </ul>
</template>
