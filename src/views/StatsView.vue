<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChartColumn, Check, Share2, TrendingDown, TrendingUp } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'
import BookCover from '@/components/book/BookCover.vue'
import GenreBars from '@/components/stats/GenreBars.vue'
import HighlightCard from '@/components/stats/HighlightCard.vue'
import MonthlyBars from '@/components/stats/MonthlyBars.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import type { LibraryBook } from '@/types/library'
import { useLibraryStore } from '@/stores/library'
import {
  MONTH_NAMES,
  compareWithPrevious,
  computeYearStats,
  describeYear,
  reviewableYears,
  shareSummary,
} from '@/lib/stats'

const library = useLibraryStore()
const route = useRoute()
const router = useRouter()
const { announce } = useAnnouncer()

const years = computed(() => reviewableYears(library.books))

const year = computed({
  get() {
    const requested = Number(route.query.year)
    return years.value.includes(requested) ? requested : years.value[0]!
  },
  set(value: number) {
    router.replace({ query: value === years.value[0] ? {} : { year: String(value) } })
  },
})

const stats = computed(() => computeYearStats(library.books, year.value))
const story = computed(() => describeYear(stats.value))
const comparison = computed(() => compareWithPrevious(stats.value))

const lastMonthIndex = computed(() =>
  stats.value.isCurrentYear ? new Date().getMonth() : undefined,
)

const days = (n: number) => `${n.toLocaleString('en')} ${n === 1 ? 'day' : 'days'}`
const pages = (n: number) => `${n.toLocaleString('en')} pages`

const highlights = computed(() => {
  const s = stats.value
  const candidates = [
    s.favorite && {
      label: 'Favorite',
      book: s.favorite,
      detail: `${s.favorite.rating} of 5 stars`,
    },
    s.longest && { label: 'Longest read', book: s.longest.book, detail: pages(s.longest.value) },
    s.shortest && {
      label: 'Shortest read',
      book: s.shortest.book,
      detail: pages(s.shortest.value),
    },
    s.fastest && { label: 'Fastest finish', book: s.fastest.book, detail: days(s.fastest.value) },
    s.slowest && { label: 'Slow burner', book: s.slowest.book, detail: days(s.slowest.value) },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

  // One book can win several titles — show it once instead of repeating the card
  const merged = new Map<string, { labels: string[]; book: LibraryBook; details: string[] }>()
  for (const { label, book, detail } of candidates) {
    const entry = merged.get(book.id) ?? { labels: [], book, details: [] }
    entry.labels.push(label)
    entry.details.push(detail)
    merged.set(book.id, entry)
  }
  return [...merged.values()].map((m) => ({
    key: m.book.id,
    label: m.labels.join(' · '),
    book: m.book,
    detail: m.details.join(' · '),
  }))
})

const facts = computed(() => {
  const s = stats.value
  const list: { label: string; value: string; hint?: string }[] = [
    { label: 'Books', value: String(s.booksRead) },
  ]
  if (s.pagesRead) {
    list.push({
      label: 'Pages',
      value: s.pagesRead.toLocaleString('en'),
      hint: s.booksWithoutPages
        ? `${s.booksWithoutPages} without a page count not included`
        : undefined,
    })
  }
  if (s.averageRating !== null) {
    list.push({
      label: 'Average rating',
      value: s.averageRating.toFixed(1),
      hint: `across ${s.ratedCount} rated`,
    })
  }
  if (s.averageDaysToFinish !== null) {
    list.push({
      label: 'Days per book',
      value: String(s.averageDaysToFinish),
      hint: 'on average, start to finish',
    })
  }
  return list
})

const authorLine = computed(() => {
  const s = stats.value
  if (s.booksRead < 2) return null
  const base = `${s.uniqueAuthors} different ${s.uniqueAuthors === 1 ? 'author' : 'authors'}`
  return s.topAuthor
    ? `${base} — ${s.topAuthor.name} was a repeat visit (${s.topAuthor.count}×)`
    : base
})

const copied = ref(false)
async function share() {
  try {
    await navigator.clipboard.writeText(shareSummary(stats.value))
    copied.value = true
    announce('Summary copied to clipboard')
    setTimeout(() => (copied.value = false), 2500)
  } catch {
    announce('Could not copy the summary')
  }
}
</script>

<template>
  <div class="space-y-10">
    <PageHeader title="Year in review">
      <template #actions>
        <div
          v-if="years.length > 1"
          role="group"
          aria-label="Year"
          class="inline-flex rounded-md border border-border bg-surface p-0.5 shadow-sm"
        >
          <button
            v-for="y in years"
            :key="y"
            type="button"
            :aria-pressed="y === year"
            class="h-9 rounded px-3 text-sm font-medium tabular-nums transition-colors"
            :class="
              y === year
                ? 'bg-accent text-white dark:text-bg-primary'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            "
            @click="year = y"
          >
            {{ y }}
          </button>
        </div>
      </template>
    </PageHeader>

    <template v-if="library.status === 'ready'">
      <EmptyState
        v-if="stats.booksRead === 0"
        :icon="ChartColumn"
        :title="story.title"
        :description="story.subtitle"
      >
        <Button v-if="stats.isCurrentYear" as-child>
          <RouterLink :to="{ name: 'shelf', params: { shelfId: 'currently-reading' } }">
            See what you're reading
          </RouterLink>
        </Button>
      </EmptyState>

      <template v-else>
        <!-- The shareable moment -->
        <section
          aria-labelledby="story-title"
          class="relative overflow-hidden rounded-xl border border-accent/20 bg-accent-subtle px-6 py-10 sm:px-10 sm:py-14"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute -right-4 -bottom-10 font-heading text-[9rem] leading-none font-bold text-accent/10 select-none sm:text-[13rem]"
          >
            {{ stats.year }}
          </span>
          <div class="relative max-w-2xl space-y-3">
            <p class="text-sm font-medium tracking-wide text-accent uppercase">
              {{ stats.isCurrentYear ? `${stats.year} so far` : `Your ${stats.year}` }}
            </p>
            <h2 id="story-title" class="text-3xl font-bold sm:text-4xl">{{ story.title }}</h2>
            <p class="text-lg text-text-secondary">{{ story.subtitle }}</p>

            <p v-if="comparison" class="flex items-center gap-2 text-sm font-medium">
              <TrendingUp
                v-if="comparison.direction === 'up'"
                class="size-4 text-success"
                aria-hidden="true"
              />
              <TrendingDown
                v-else-if="comparison.direction === 'down'"
                class="size-4 text-warning"
                aria-hidden="true"
              />
              {{ comparison.label }}
            </p>

            <dl class="grid grid-cols-2 gap-x-8 gap-y-5 pt-4 sm:grid-cols-4">
              <div v-for="fact in facts" :key="fact.label">
                <dt class="text-sm text-text-secondary">{{ fact.label }}</dt>
                <dd class="font-heading text-3xl font-bold tabular-nums sm:text-4xl">
                  {{ fact.value }}
                </dd>
                <p v-if="fact.hint" class="text-xs text-text-tertiary">{{ fact.hint }}</p>
              </div>
            </dl>

            <div class="pt-4">
              <Button variant="secondary" size="sm" @click="share">
                <Check v-if="copied" aria-hidden="true" />
                <Share2 v-else aria-hidden="true" />
                {{ copied ? 'Copied' : 'Copy summary' }}
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="months-title" class="space-y-4">
          <div>
            <h2 id="months-title" class="text-xl font-semibold">Books by month</h2>
            <p v-if="stats.busiestMonth" class="text-text-secondary">
              {{ MONTH_NAMES[stats.busiestMonth.month] }} was your busiest —
              {{ stats.busiestMonth.count }}
              {{ stats.busiestMonth.count === 1 ? 'book' : 'books' }} finished.
            </p>
            <p v-else class="text-text-secondary">A steady rhythm — no single month stood out.</p>
          </div>
          <div class="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-6">
            <MonthlyBars :months="stats.months" :last-month-index="lastMonthIndex" />
          </div>
        </section>

        <div class="grid gap-10 lg:grid-cols-2">
          <section v-if="stats.genres.length" aria-labelledby="genres-title" class="space-y-4">
            <div>
              <h2 id="genres-title" class="text-xl font-semibold">What you read</h2>
              <p class="text-text-secondary">{{ stats.genres[0]!.name }} led the way.</p>
            </div>
            <div class="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-6">
              <GenreBars :genres="stats.genres" />
            </div>
          </section>

          <section v-if="highlights.length" aria-labelledby="highlights-title" class="space-y-4">
            <div>
              <h2 id="highlights-title" class="text-xl font-semibold">Standouts</h2>
              <p v-if="authorLine" class="text-text-secondary">{{ authorLine }}</p>
            </div>
            <ul role="list" class="space-y-3">
              <li v-for="item in highlights" :key="item.key">
                <HighlightCard :label="item.label" :book="item.book" :detail="item.detail" />
              </li>
            </ul>
          </section>
        </div>

        <section aria-labelledby="finished-title" class="space-y-4">
          <h2 id="finished-title" class="text-xl font-semibold">
            Everything you finished
            <span class="ml-1 font-sans text-sm font-normal text-text-tertiary tabular-nums">
              {{ stats.booksRead }}
            </span>
          </h2>
          <ul
            role="list"
            class="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10"
          >
            <li v-for="book in stats.books" :key="book.id">
              <RouterLink
                :to="{ name: 'book', params: { bookId: book.id } }"
                :title="book.title"
                class="block rounded-sm transition-transform hover:-translate-y-0.5"
              >
                <BookCover :title="book.title" :src="book.coverUrl" size="S" class="w-full" />
                <span class="sr-only">{{ book.title }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </template>
    </template>

    <p v-else-if="library.status === 'loading'" role="status" class="text-text-secondary">
      Loading your reading year…
    </p>
    <p v-else-if="library.status === 'error'" role="alert" class="text-error">
      {{ library.loadError }}
    </p>
  </div>
</template>
