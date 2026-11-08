<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { BookOpen, SearchX } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'
import BookGrid from '@/components/book/BookGrid.vue'
import BookGridSkeleton from '@/components/book/BookGridSkeleton.vue'
import { useLibraryStore } from '@/stores/library'
import { sortForShelf } from '@/lib/books'

const props = defineProps<{ shelfId: string }>()

const library = useLibraryStore()
const shelf = computed(() => library.getShelf(props.shelfId))
const books = computed(() => sortForShelf(library.booksOn(props.shelfId), props.shelfId))

const pageTitle = computed(() => {
  if (library.status !== 'ready') return 'Shelf'
  return shelf.value?.name ?? 'Shelf not found'
})
useTitle(() => `${pageTitle.value} · Bookshelf`)
</script>

<template>
  <div v-if="library.status === 'loading'" class="space-y-8" aria-busy="true">
    <div class="h-10 w-48 animate-pulse rounded bg-bg-tertiary" aria-hidden="true" />
    <p class="sr-only" role="status">Loading shelf…</p>
    <BookGridSkeleton />
  </div>

  <div v-else-if="shelf" class="space-y-8">
    <PageHeader
      :title="shelf.name"
      :description="`${books.length} ${books.length === 1 ? 'book' : 'books'}`"
    />

    <BookGrid
      v-if="books.length"
      :books="books"
      :show-progress="shelf.id === 'currently-reading'"
    />

    <EmptyState
      v-else
      :icon="BookOpen"
      title="This shelf is waiting for its first book"
      description="Search for a book and place it here — it'll show up right away."
    >
      <Button as-child>
        <RouterLink to="/search">Find books</RouterLink>
      </Button>
    </EmptyState>
  </div>

  <div v-else-if="library.status === 'ready'" class="space-y-8">
    <PageHeader title="Shelf not found" />
    <EmptyState
      :icon="SearchX"
      title="We couldn't find that shelf"
      description="It may have been renamed or removed. Your books are safe in your library."
    >
      <Button as-child variant="secondary">
        <RouterLink to="/library">Back to library</RouterLink>
      </Button>
    </EmptyState>
  </div>
</template>
