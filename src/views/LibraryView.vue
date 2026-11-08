<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { Button } from '@/components/ui/button'
import BookCard from '@/components/book/BookCard.vue'
import BookGridSkeleton from '@/components/book/BookGridSkeleton.vue'
import CurrentlyReadingCard from '@/components/book/CurrentlyReadingCard.vue'
import { useLibraryStore } from '@/stores/library'
import { sortForShelf } from '@/lib/books'

const library = useLibraryStore()

const PREVIEW_SIZE = 6
// Cover previews show 3 → 6 columns as space allows; extra covers are hidden, not squeezed
const PREVIEW_VISIBILITY = ['', '', '', 'hidden sm:block', 'hidden md:block', 'hidden xl:block']

const currentlyReading = computed(() =>
  sortForShelf(library.booksOn('currently-reading'), 'currently-reading'),
)

const otherShelves = computed(() =>
  library.sortedShelves
    .filter((shelf) => shelf.id !== 'currently-reading')
    .map((shelf) => ({
      shelf,
      count: library.countFor(shelf.id),
      preview: sortForShelf(library.booksOn(shelf.id), shelf.id).slice(0, PREVIEW_SIZE),
    })),
)

const stats = computed(() => {
  const goal = library.currentGoal
  const read = library.finishedThisYear.length
  return [
    { label: 'Books in library', value: String(library.books.length) },
    { label: `Read in ${new Date().getFullYear()}`, value: String(read) },
    goal
      ? {
          label: 'Yearly goal',
          value: `${Math.min(100, Math.round((read / goal.target) * 100))}%`,
          to: '/goals',
        }
      : { label: 'Yearly goal', value: 'Set one', to: '/goals' },
  ]
})
</script>

<template>
  <div class="space-y-12">
    <PageHeader title="Library" description="Everything you've read, are reading and want to read.">
      <template #actions>
        <Button as-child variant="secondary">
          <RouterLink :to="{ name: 'shelf', params: { shelfId: 'all' } }">All books</RouterLink>
        </Button>
        <Button as-child>
          <RouterLink to="/search">Find books</RouterLink>
        </Button>
      </template>
    </PageHeader>

    <template v-if="library.status === 'ready'">
      <dl class="grid grid-cols-3 gap-3 sm:gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="relative rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-sm sm:px-5 sm:py-4"
        >
          <dt class="text-xs text-text-secondary sm:text-sm">
            <RouterLink
              v-if="stat.to"
              :to="stat.to"
              class="after:absolute after:inset-0 after:rounded-lg hover:text-accent"
            >
              {{ stat.label }}
            </RouterLink>
            <template v-else>{{ stat.label }}</template>
          </dt>
          <dd class="mt-1 font-heading text-2xl font-bold tabular-nums sm:text-3xl">
            {{ stat.value }}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="shelf-currently-reading" class="space-y-4">
        <div class="flex items-baseline justify-between gap-4">
          <h2 id="shelf-currently-reading" class="text-xl font-semibold">
            Currently Reading
            <span class="ml-1 font-sans text-sm font-normal text-text-tertiary tabular-nums">
              {{ currentlyReading.length }}
            </span>
          </h2>
          <RouterLink
            :to="{ name: 'shelf', params: { shelfId: 'currently-reading' } }"
            class="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
          >
            See all<span class="sr-only"> currently reading</span>
            <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
        </div>
        <ul
          v-if="currentlyReading.length"
          role="list"
          class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <li v-for="book in currentlyReading" :key="book.id">
            <CurrentlyReadingCard :book="book" />
          </li>
        </ul>
        <p
          v-else
          class="rounded-lg border border-dashed border-border px-4 py-6 text-text-secondary"
        >
          Nothing on the go right now. Pick something from Want to Read and dive in.
        </p>
      </section>

      <section
        v-for="{ shelf, count, preview } in otherShelves"
        :key="shelf.id"
        :aria-labelledby="`shelf-${shelf.id}`"
        class="space-y-4"
      >
        <div class="flex items-baseline justify-between gap-4">
          <h2 :id="`shelf-${shelf.id}`" class="text-xl font-semibold">
            {{ shelf.name }}
            <span class="ml-1 font-sans text-sm font-normal text-text-tertiary tabular-nums">
              {{ count }}
            </span>
          </h2>
          <RouterLink
            v-if="count"
            :to="{ name: 'shelf', params: { shelfId: shelf.id } }"
            class="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
          >
            See all<span class="sr-only"> on {{ shelf.name }}</span>
            <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
        </div>

        <ul
          v-if="preview.length"
          role="list"
          class="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-5 md:grid-cols-5 xl:grid-cols-6"
        >
          <li v-for="(book, index) in preview" :key="book.id" :class="PREVIEW_VISIBILITY[index]">
            <BookCard :book="book" />
          </li>
        </ul>
        <p
          v-else
          class="rounded-lg border border-dashed border-border px-4 py-6 text-text-secondary"
        >
          This shelf is waiting for its first book.
          <RouterLink to="/search" class="font-medium text-accent hover:text-accent-hover">
            Search to add one.
          </RouterLink>
        </p>
      </section>
    </template>

    <div v-else-if="library.status === 'loading'" class="space-y-6" aria-busy="true">
      <p class="sr-only" role="status">Loading your library…</p>
      <BookGridSkeleton :count="12" />
    </div>
  </div>
</template>
