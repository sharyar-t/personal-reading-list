<script setup lang="ts">
import { ChevronDown, FilterX } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS, type BookFilters, type Facet, type SortKey } from '@/lib/browse'

const props = defineProps<{
  sort: SortKey
  filters: BookFilters
  genres: Facet[]
  authors: Facet[]
  filtered: boolean
}>()
const emit = defineEmits<{
  'update:sort': [value: SortKey]
  'update:filters': [value: BookFilters]
  clear: []
}>()

const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 5, label: '5 stars' },
  { value: 4, label: '4 stars & up' },
  { value: 3, label: '3 stars & up' },
]

function patch(change: Partial<BookFilters>) {
  emit('update:filters', { ...props.filters, ...change })
}

const selectClass =
  'h-11 w-full cursor-pointer appearance-none rounded-md border border-border bg-surface pr-9 pl-3 text-sm shadow-sm hover:border-text-tertiary focus-visible:border-accent'
</script>

<template>
  <div
    role="group"
    aria-label="Sort and filter"
    class="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end"
  >
    <div>
      <label for="browse-sort" class="mb-1 block text-xs font-medium text-text-secondary">
        Sort by
      </label>
      <div class="relative">
        <select
          id="browse-sort"
          :value="sort"
          :class="selectClass"
          @change="emit('update:sort', ($event.target as HTMLSelectElement).value as SortKey)"
        >
          <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
      </div>
    </div>

    <div>
      <label for="browse-genre" class="mb-1 block text-xs font-medium text-text-secondary">
        Genre
      </label>
      <div class="relative">
        <select
          id="browse-genre"
          :value="filters.genre"
          :class="selectClass"
          @change="patch({ genre: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">All genres</option>
          <option v-for="genre in genres" :key="genre.name" :value="genre.name">
            {{ genre.name }} ({{ genre.count }})
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
      </div>
    </div>

    <div>
      <label for="browse-author" class="mb-1 block text-xs font-medium text-text-secondary">
        Author
      </label>
      <div class="relative">
        <select
          id="browse-author"
          :value="filters.author"
          :class="selectClass"
          @change="patch({ author: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">All authors</option>
          <option v-for="author in authors" :key="author.name" :value="author.name">
            {{ author.name }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
      </div>
    </div>

    <div>
      <label for="browse-rating" class="mb-1 block text-xs font-medium text-text-secondary">
        Rating
      </label>
      <div class="relative">
        <select
          id="browse-rating"
          :value="filters.minRating"
          :class="selectClass"
          @change="patch({ minRating: Number(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="option in RATING_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
      </div>
    </div>

    <Button v-if="filtered" variant="ghost" class="col-span-2 lg:col-span-1" @click="emit('clear')">
      <FilterX aria-hidden="true" />
      Clear filters
    </Button>
  </div>
</template>
