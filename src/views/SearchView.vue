<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { BookX, CloudOff, Compass, LoaderCircle, Search, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'
import SearchResultItem from '@/components/search/SearchResultItem.vue'
import { useBookSearch } from '@/composables/useBookSearch'
import type { SearchScope } from '@/services/openLibrary/api'

const search = useBookSearch()
const { query, scope, results, status } = search
const input = useTemplateRef<HTMLInputElement>('input')

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
]

const numberFormat = new Intl.NumberFormat('en')

const summary = computed(() => {
  if (status.value !== 'success' && status.value !== 'loading-more') return ''
  if (!results.value.length) return `No books found for “${search.searchedQuery.value}”`
  const shown = numberFormat.format(results.value.length)
  const total = numberFormat.format(search.total.value)
  return `Showing ${shown} of ${total} ${search.total.value === 1 ? 'result' : 'results'} for “${search.searchedQuery.value}”`
})

/** Suggest the other scopes when a search comes back empty */
const alternativeScopes = computed(() =>
  SCOPE_OPTIONS.filter((option) => option.value !== scope.value),
)

function onScopeChange(value: unknown) {
  if (typeof value === 'string') scope.value = value as SearchScope
}

function clear() {
  query.value = ''
  input.value?.focus()
}
</script>

<template>
  <div class="mx-auto max-w-content space-y-8">
    <PageHeader
      title="Find books"
      description="Search millions of books from Open Library by title, author or ISBN."
    />

    <form role="search" class="space-y-3" @submit.prevent="search.searchNow()">
      <div class="relative">
        <label for="book-search" class="sr-only">Search by title, author or ISBN</label>
        <component
          :is="search.isLoading.value ? LoaderCircle : Search"
          class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-tertiary"
          :class="search.isLoading.value && 'animate-spin text-accent'"
          aria-hidden="true"
        />
        <input
          id="book-search"
          ref="input"
          v-model="query"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Title, author or ISBN"
          aria-describedby="search-hint"
          class="h-13 w-full rounded-md border border-border bg-surface pr-12 pl-12 text-base shadow-sm placeholder:text-text-tertiary focus-visible:border-accent [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          v-if="query"
          type="button"
          class="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-md text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Clear search"
          @click="clear"
        >
          <X class="size-5" aria-hidden="true" />
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroupRoot
          type="single"
          :model-value="scope"
          aria-label="Search in"
          class="inline-flex rounded-md border border-border bg-bg-secondary p-0.5"
          @update:model-value="onScopeChange"
        >
          <ToggleGroupItem
            v-for="option in SCOPE_OPTIONS"
            :key="option.value"
            :value="option.value"
            class="h-9 rounded-[calc(var(--radius-md)-2px)] px-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary data-[state=on]:bg-surface data-[state=on]:text-text-primary data-[state=on]:shadow-sm"
          >
            {{ option.label }}
          </ToggleGroupItem>
        </ToggleGroupRoot>
        <p id="search-hint" class="text-sm text-text-tertiary">
          Tip: paste an ISBN to find an exact edition.
        </p>
      </div>
    </form>

    <!-- Announced to screen readers as results change -->
    <p class="sr-only" role="status" aria-live="polite">
      {{ status === 'loading' ? 'Searching…' : summary }}
    </p>

    <!-- Error -->
    <EmptyState
      v-if="status === 'error' && !results.length"
      :icon="CloudOff"
      title="Search isn't working right now"
      :description="search.error.value ?? ''"
    >
      <Button variant="secondary" @click="search.retry()">Try again</Button>
    </EmptyState>

    <!-- First page loading -->
    <ul v-else-if="status === 'loading'" class="divide-y divide-border-subtle" aria-hidden="true">
      <li v-for="n in 5" :key="n" class="flex animate-pulse gap-5 py-5">
        <div class="aspect-2/3 w-16 shrink-0 rounded-sm bg-bg-tertiary sm:w-20" />
        <div class="flex-1 space-y-2.5 pt-1">
          <div class="h-5 w-3/5 rounded bg-bg-tertiary" />
          <div class="h-4 w-2/5 rounded bg-bg-tertiary" />
          <div class="h-3.5 w-1/3 rounded bg-bg-tertiary" />
        </div>
      </li>
    </ul>

    <!-- Results -->
    <section v-else-if="results.length" aria-labelledby="results-summary" class="space-y-2">
      <p id="results-summary" class="text-sm text-text-secondary" aria-hidden="true">
        {{ summary }}
      </p>
      <ul role="list" class="divide-y divide-border-subtle">
        <li v-for="result in results" :key="result.metadata.workKey ?? result.metadata.title">
          <SearchResultItem :result="result" />
        </li>
      </ul>

      <div class="flex flex-col items-center gap-3 pt-4">
        <p v-if="status === 'error'" class="text-sm text-error" role="alert">
          {{ search.error.value }}
        </p>
        <Button
          v-if="search.hasMore.value || status === 'error'"
          variant="secondary"
          :disabled="status === 'loading-more'"
          @click="status === 'error' ? search.retry() : search.loadMore()"
        >
          <LoaderCircle v-if="status === 'loading-more'" class="animate-spin" aria-hidden="true" />
          {{
            status === 'loading-more'
              ? 'Loading more…'
              : status === 'error'
                ? 'Try again'
                : 'Show more results'
          }}
        </Button>
        <p v-else class="text-sm text-text-tertiary">That's everything for this search.</p>
      </div>
    </section>

    <!-- No results -->
    <EmptyState
      v-else-if="status === 'success'"
      :icon="BookX"
      title="No books found"
      :description="`Nothing matched “${search.searchedQuery.value}”. Check the spelling, try fewer words, or search a different way.`"
    >
      <div class="flex flex-wrap justify-center gap-2">
        <Button
          v-for="option in alternativeScopes"
          :key="option.value"
          size="sm"
          variant="secondary"
          @click="scope = option.value"
        >
          Search {{ option.value === 'all' ? 'everything' : `by ${option.label.toLowerCase()}` }}
        </Button>
      </div>
    </EmptyState>

    <!-- Nothing typed yet -->
    <EmptyState
      v-else
      :icon="Search"
      title="What are you reading next?"
      description="Try a title like “Piranesi”, an author like “Ursula K. Le Guin”, or paste an ISBN."
    >
      <Button as-child variant="secondary">
        <RouterLink to="/explore"><Compass aria-hidden="true" />Or see what's trending</RouterLink>
      </Button>
    </EmptyState>
  </div>
</template>
