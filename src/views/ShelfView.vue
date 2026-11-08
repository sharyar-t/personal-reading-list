<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { BookOpen, FilterX, SearchX } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'
import BookBrowseControls from '@/components/book/BookBrowseControls.vue'
import BookGrid from '@/components/book/BookGrid.vue'
import BookGridSkeleton from '@/components/book/BookGridSkeleton.vue'
import { useBrowseState } from '@/composables/useBrowseState'
import { useLibraryStore } from '@/stores/library'
import { browseFacets, filterBooks, sortBooks } from '@/lib/browse'

const props = defineProps<{ shelfId: string }>()

const library = useLibraryStore()
const ALL_BOOKS = { id: 'all', name: 'All books' }

/** "all" is a virtual shelf: every book in the library, filterable as one list */
const shelf = computed(() =>
  props.shelfId === ALL_BOOKS.id ? ALL_BOOKS : library.getShelf(props.shelfId),
)
const shelfBooks = computed(() =>
  props.shelfId === ALL_BOOKS.id ? library.books : library.booksOn(props.shelfId),
)

const { sort, filters, isFiltered, setSort, setFilters, clearFilters } = useBrowseState()
const facets = computed(() => browseFacets(shelfBooks.value))
const books = computed(() =>
  sortBooks(filterBooks(shelfBooks.value, filters.value), sort.value, props.shelfId),
)

const countLabel = computed(() => {
  const total = shelfBooks.value.length
  const noun = (n: number) => (n === 1 ? 'book' : 'books')
  return isFiltered.value
    ? `${books.value.length} of ${total} ${noun(total)}`
    : `${total} ${noun(total)}`
})

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
    <PageHeader :title="shelf.name" />

    <template v-if="shelfBooks.length > 1">
      <BookBrowseControls
        :sort="sort"
        :filters="filters"
        :genres="facets.genres"
        :authors="facets.authors"
        :filtered="isFiltered"
        @update:sort="setSort"
        @update:filters="setFilters"
        @clear="clearFilters"
      />
    </template>
    <p role="status" class="text-sm text-text-secondary tabular-nums">{{ countLabel }}</p>

    <BookGrid
      v-if="books.length"
      :books="books"
      :show-progress="shelf.id === 'currently-reading'"
    />

    <EmptyState
      v-else-if="isFiltered"
      :icon="FilterX"
      title="No books match these filters"
      description="Try a different genre, author or rating — or clear the filters to see everything."
    >
      <Button variant="secondary" @click="clearFilters">Clear filters</Button>
    </EmptyState>

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
