<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, ChartColumn, Library, Search, Sparkles, TrendingUp } from '@lucide/vue'
import AppLogo from '@/components/layout/AppLogo.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import BookCover from '@/components/book/BookCover.vue'
import { Button } from '@/components/ui/button'

// A handful of books from data/sample-books.json, hardcoded so the landing
// bundle doesn't pull in the whole sample library.
const shelfBooks = [
  {
    title: 'Circe',
    author: 'Madeline Miller',
    cover: 'https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg',
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    cover: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg',
  },
  // No cover in the API — shows off the styled placeholder
  { title: 'Piranesi', author: 'Susanna Clarke', cover: null },
  {
    title: 'Educated',
    author: 'Tara Westover',
    cover: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg',
  },
  {
    title: 'A Gentleman in Moscow',
    author: 'Amor Towles',
    cover: 'https://covers.openlibrary.org/b/isbn/9780143110439-L.jpg',
  },
]

const currentlyReading = {
  title: 'Project Hail Mary',
  author: 'Andy Weir',
  cover: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
  page: 295,
  pageCount: 476,
}
const readingPercent = Math.round((currentlyReading.page / currentlyReading.pageCount) * 100)

const goal = { read: 18, target: 24 }
const goalPercent = Math.round((goal.read / goal.target) * 100)

const features = [
  {
    icon: Search,
    title: 'Find any book',
    description:
      'Search millions of titles by name, author or ISBN — with covers, page counts and editions sorted out for you.',
  },
  {
    icon: Library,
    title: 'Shelves your way',
    description:
      'Want to Read, Currently Reading, Read — plus shelves of your own for book clubs, favorites or lent-out copies.',
  },
  {
    icon: TrendingUp,
    title: 'Progress you can feel',
    description:
      'Log your page in a tap and watch the bar fill. Finishing a book should feel like an accomplishment.',
  },
  {
    icon: ChartColumn,
    title: 'Your year in books',
    description:
      'Set a yearly goal, see if you’re on pace, and look back on months, genres and pages read.',
  },
]
</script>

<template>
  <div class="min-h-dvh overflow-x-clip">
    <header
      class="mx-auto flex h-18 max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
    >
      <AppLogo />
      <div class="flex items-center gap-3">
        <ThemeToggle class="max-sm:hidden" />
        <Button as-child size="sm">
          <RouterLink to="/library">Open My Library</RouterLink>
        </Button>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section
        aria-labelledby="hero-heading"
        class="mx-auto grid max-w-page items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10 lg:pt-16 lg:pb-28"
      >
        <div class="flex flex-col items-start gap-6">
          <p
            class="inline-flex items-center gap-2 rounded-full bg-accent-subtle px-3 py-1 text-sm font-medium text-accent"
          >
            <Sparkles class="size-4" aria-hidden="true" />
            Your personal reading tracker
          </p>
          <h1
            id="hero-heading"
            class="text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.05] font-bold tracking-tight"
          >
            Your reading life, <em class="text-accent">beautifully</em> organized.
          </h1>
          <p class="max-w-xl text-lg text-text-secondary">
            Search for books, arrange them on shelves, track every page and see your year in reading
            come together — all in one calm, cozy place.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <Button as-child size="lg">
              <RouterLink to="/library">
                Open My Library
                <ArrowRight aria-hidden="true" />
              </RouterLink>
            </Button>
            <Button as-child size="lg" variant="secondary">
              <a href="#features">See what’s inside</a>
            </Button>
          </div>
          <p class="text-sm text-text-tertiary">
            No sign-up needed — 45 hand-picked books are already waiting on your shelves.
          </p>
        </div>

        <!-- Product showcase -->
        <figure class="relative">
          <figcaption class="sr-only">
            A preview of a Bookshelf library: five books on a shelf, Project Hail Mary in progress
            at {{ readingPercent }}%, and a yearly goal of {{ goal.read }} of
            {{ goal.target }} books.
          </figcaption>

          <div aria-hidden="true">
            <div
              class="absolute inset-x-6 top-6 -z-10 h-3/4 rounded-full bg-accent-subtle blur-3xl"
            />

            <!-- The shelf -->
            <div class="flex items-end justify-center gap-3 px-2 sm:gap-4">
              <div
                v-for="(book, index) in shelfBooks"
                :key="book.title"
                class="w-[22%] max-w-32 transition-transform duration-300 hover:-translate-y-1.5"
                :class="[index === 4 && 'max-sm:hidden', index % 2 === 1 && '-mb-1']"
              >
                <BookCover
                  :title="book.title"
                  :author="book.author"
                  :src="book.cover"
                  eager
                  decorative
                />
              </div>
            </div>
            <div
              class="relative h-3 rounded-sm bg-linear-to-b from-border to-bg-tertiary shadow-md"
            />

            <!-- Floating cards -->
            <div class="mx-auto mt-8 grid max-w-lg gap-4 sm:grid-cols-2">
              <div class="rounded-xl border border-border-subtle bg-surface p-4 shadow-lg">
                <p class="text-xs font-semibold tracking-wider text-text-tertiary uppercase">
                  Currently reading
                </p>
                <div class="mt-3 flex gap-3">
                  <BookCover
                    :title="currentlyReading.title"
                    :author="currentlyReading.author"
                    :src="currentlyReading.cover"
                    size="S"
                    eager
                    decorative
                    class="w-12 shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-heading font-semibold">{{ currentlyReading.title }}</p>
                    <p class="truncate text-sm text-text-secondary">
                      {{ currentlyReading.author }}
                    </p>
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        class="h-full rounded-full bg-progress"
                        :style="{ width: `${readingPercent}%` }"
                      />
                    </div>
                    <p class="mt-1 text-xs text-text-tertiary tabular-nums">
                      p. {{ currentlyReading.page }} of {{ currentlyReading.pageCount }} ·
                      {{ readingPercent }}%
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-border-subtle bg-surface p-4 shadow-lg sm:mt-8">
                <p class="text-xs font-semibold tracking-wider text-text-tertiary uppercase">
                  2026 reading goal
                </p>
                <p class="mt-2 font-heading text-3xl font-bold tabular-nums">
                  {{ goal.read
                  }}<span class="ml-1 text-lg font-normal text-text-tertiary"
                    >/&nbsp;{{ goal.target }}</span
                  >
                </p>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    class="h-full rounded-full bg-success"
                    :style="{ width: `${goalPercent}%` }"
                  />
                </div>
                <p class="mt-2 text-sm font-medium text-success">2 books ahead of pace</p>
              </div>
            </div>
          </div>
        </figure>
      </section>

      <!-- Features -->
      <section
        id="features"
        aria-labelledby="features-heading"
        class="scroll-mt-6 border-y border-border-subtle bg-bg-secondary"
      >
        <div class="mx-auto max-w-page px-4 py-20 sm:px-6 lg:px-10">
          <div class="mx-auto max-w-2xl text-center">
            <h2 id="features-heading" class="text-3xl font-bold">
              Everything your reading life needs
            </h2>
            <p class="mt-3 text-lg text-text-secondary">
              Less bookkeeping, more reading. Bookshelf keeps track so you can stay in the story.
            </p>
          </div>

          <ul class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
            <li
              v-for="feature in features"
              :key="feature.title"
              class="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
            >
              <span class="grid size-11 place-items-center rounded-lg bg-accent-subtle text-accent">
                <component :is="feature.icon" class="size-5" aria-hidden="true" />
              </span>
              <h3 class="mt-4 text-lg font-semibold">{{ feature.title }}</h3>
              <p class="mt-2 text-text-secondary">{{ feature.description }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- Closing CTA -->
      <section aria-labelledby="cta-heading" class="mx-auto max-w-page px-4 py-20 sm:px-6 lg:px-10">
        <div
          class="flex flex-col items-center gap-5 rounded-xl bg-accent-subtle px-6 py-14 text-center"
        >
          <h2 id="cta-heading" class="text-3xl font-bold">Your next chapter starts here</h2>
          <p class="max-w-lg text-text-secondary">
            Open your library and explore a shelf already full of great books — then make it yours.
          </p>
          <Button as-child size="lg">
            <RouterLink to="/library">
              Open My Library
              <ArrowRight aria-hidden="true" />
            </RouterLink>
          </Button>
        </div>
      </section>
    </main>

    <footer class="border-t border-border-subtle">
      <div
        class="mx-auto flex max-w-page flex-col gap-2 px-4 py-8 text-sm text-text-tertiary sm:flex-row sm:justify-between sm:px-6 lg:px-10"
      >
        <p>
          A
          <a
            href="https://www.frontendmentor.io"
            class="underline underline-offset-2 hover:text-text-primary"
            >Frontend Mentor</a
          >
          product challenge.
        </p>
        <p>
          Book data from
          <a
            href="https://openlibrary.org"
            class="underline underline-offset-2 hover:text-text-primary"
            >Open Library</a
          >.
        </p>
      </div>
    </footer>
  </div>
</template>
