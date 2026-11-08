<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useTitle } from '@vueuse/core'
import { ArrowLeft, BookOpen, SearchX } from '@lucide/vue'
import { useLibraryStore } from '@/stores/library'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { formatAuthors } from '@/lib/books'
import { formatDate } from '@/lib/dates'
import BookCover from '@/components/book/BookCover.vue'
import BookDescription from '@/components/book/BookDescription.vue'
import BookNotes from '@/components/book/BookNotes.vue'
import FinishedCard from '@/components/book/FinishedCard.vue'
import ReadingProgress from '@/components/book/ReadingProgress.vue'
import RemoveBookButton from '@/components/book/RemoveBookButton.vue'
import BookQuickActions from '@/components/book/BookQuickActions.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ bookId: string }>()

const router = useRouter()
const library = useLibraryStore()
const { announce } = useAnnouncer()

const book = computed(() => library.getBook(props.bookId))
const shelf = computed(() => (book.value ? library.getShelf(book.value.shelfId) : undefined))

useTitle(() => {
  if (library.status !== 'ready') return 'Book · Bookshelf'
  return `${book.value?.title ?? 'Book not found'} · Bookshelf`
})

// ── Back navigation ──────────────────────────────────────────────────────
// Go back to wherever the reader came from (a shelf, search results…);
// on a direct visit fall back to the book's shelf.
const cameFromApp = typeof window !== 'undefined' && !!window.history.state?.back
const backLabel = computed(() =>
  cameFromApp ? 'Back' : `Back to ${shelf.value?.name ?? 'library'}`,
)

function goBack() {
  if (cameFromApp) router.back()
  else if (shelf.value) router.push({ name: 'shelf', params: { shelfId: shelf.value.id } })
  else router.push('/library')
}

// ── Reading progress & finishing ─────────────────────────────────────────
const isReading = computed(() => book.value?.shelfId === 'currently-reading')
const reachedEnd = computed(() => isReading.value && book.value?.progress?.percent === 100)
/** "Not yet" hides the celebration until progress changes again */
const dismissedAt = ref<string | null>(null)
const showFinished = computed(
  () => reachedEnd.value && dismissedAt.value !== book.value?.progress?.updatedAt,
)

watch(
  () => props.bookId,
  () => (dismissedAt.value = null),
)

async function finishBook() {
  if (!book.value) return
  await library.moveBook(book.value.id, 'read')
  announce(`${book.value.title} moved to Read. Nice work!`)
}

async function startReading() {
  if (!book.value) return
  await library.moveBook(book.value.id, 'currently-reading')
  announce(`Started reading ${book.value.title}`)
}

// ── Details ──────────────────────────────────────────────────────────────
/** Only the facts we actually have — sparse books get a shorter list, not empty rows */
const facts = computed(() => {
  const b = book.value
  if (!b) return []
  return [
    { label: 'Pages', value: b.pageCount?.toString() },
    { label: 'First published', value: b.publishYear?.toString() },
    { label: 'Publisher', value: b.publisher },
    { label: 'ISBN-13', value: b.isbn13 },
    { label: 'ISBN-10', value: b.isbn10 },
    { label: 'Added', value: b.addedAt && formatDate(b.addedAt) },
    { label: 'Started', value: b.startedAt && formatDate(b.startedAt) },
    { label: 'Finished', value: b.finishedAt && formatDate(b.finishedAt) },
  ].filter((row): row is { label: string; value: string } => !!row.value)
})

async function removeBook() {
  if (!book.value) return
  const { title, shelfId: from } = book.value
  await library.removeBook(book.value.id)
  announce(`Removed ${title} from your library`)
  router.replace({ name: 'shelf', params: { shelfId: from } })
}
</script>

<template>
  <!-- Loading -->
  <div
    v-if="library.status !== 'ready'"
    class="grid animate-pulse gap-10 md:grid-cols-[14rem_1fr] lg:grid-cols-[16rem_1fr]"
    aria-busy="true"
  >
    <p class="sr-only" role="status">Loading book…</p>
    <div class="mx-auto aspect-2/3 w-44 rounded-sm bg-bg-tertiary md:w-full" />
    <div class="space-y-4">
      <div class="h-10 w-2/3 rounded bg-bg-tertiary" />
      <div class="h-5 w-1/3 rounded bg-bg-tertiary" />
      <div class="h-32 rounded bg-bg-tertiary" />
    </div>
  </div>

  <!-- Not found -->
  <div v-else-if="!book" class="space-y-8">
    <h1 class="text-3xl font-bold">Book not found</h1>
    <EmptyState
      :icon="SearchX"
      title="This book isn't in your library"
      description="It may have been removed. You can search for it again and add it back."
    >
      <div class="flex flex-wrap justify-center gap-3">
        <Button as-child>
          <RouterLink to="/search">Find books</RouterLink>
        </Button>
        <Button as-child variant="secondary">
          <RouterLink to="/library">Back to library</RouterLink>
        </Button>
      </div>
    </EmptyState>
  </div>

  <article v-else class="space-y-6">
    <button
      type="button"
      class="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
      @click="goBack"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ backLabel }}
    </button>

    <div class="grid gap-x-12 gap-y-8 md:grid-cols-[14rem_1fr] lg:grid-cols-[16rem_1fr]">
      <!-- Cover (and, on wider screens, shelf & rating beside the content) -->
      <aside
        class="flex flex-col gap-6 md:sticky md:top-10 md:self-start"
        aria-label="Cover, shelf and rating"
      >
        <BookCover
          :title="book.title"
          :author="book.authors[0]"
          :src="book.coverUrl"
          size="L"
          eager
          class="mx-auto w-44 rounded-md sm:w-52 md:w-full"
        />
        <BookQuickActions :book="book" id-prefix="aside" class="max-md:hidden" />
      </aside>

      <div class="min-w-0 space-y-10">
        <!-- Title block -->
        <header class="space-y-3">
          <div>
            <h1 class="text-3xl leading-tight font-bold sm:text-4xl">{{ book.title }}</h1>
            <p v-if="book.subtitle" class="mt-1 font-heading text-xl text-text-secondary">
              {{ book.subtitle }}
            </p>
          </div>
          <p class="text-lg text-text-secondary">by {{ formatAuthors(book.authors) }}</p>
          <ul v-if="book.genres.length" role="list" class="flex flex-wrap gap-2">
            <li
              v-for="genre in book.genres"
              :key="genre"
              class="rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-medium text-text-secondary"
            >
              {{ genre }}
            </li>
          </ul>
        </header>

        <!-- On narrow screens shelf & rating follow the title instead of preceding it -->
        <BookQuickActions :book="book" id-prefix="inline" class="md:hidden" />

        <!-- Reading progress / finishing moment -->
        <FinishedCard
          v-if="showFinished"
          :book="book"
          @finish="finishBook"
          @dismiss="dismissedAt = book.progress?.updatedAt ?? null"
        />
        <section
          v-else-if="isReading"
          aria-labelledby="progress-heading"
          class="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6"
        >
          <h2 id="progress-heading" class="mb-4 text-xl font-semibold">Reading progress</h2>
          <ReadingProgress :book="book" />
        </section>
        <div
          v-else-if="book.shelfId === 'want-to-read'"
          class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-bg-secondary px-5 py-4"
        >
          <p class="text-text-secondary">Ready to dive in? We'll start tracking your progress.</p>
          <Button @click="startReading">
            <BookOpen aria-hidden="true" />
            Start reading
          </Button>
        </div>

        <section v-if="book.description" aria-labelledby="about-heading" class="space-y-3">
          <h2 id="about-heading" class="text-xl font-semibold">About this book</h2>
          <BookDescription :text="book.description" />
        </section>

        <section aria-labelledby="notes-heading" class="space-y-3">
          <h2 id="notes-heading" class="text-xl font-semibold">Your notes</h2>
          <BookNotes :book="book" />
        </section>

        <section aria-labelledby="details-heading" class="space-y-3">
          <h2 id="details-heading" class="text-xl font-semibold">Details</h2>
          <dl class="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div
              v-for="row in facts"
              :key="row.label"
              class="flex justify-between gap-4 border-b border-border-subtle pb-2"
            >
              <dt class="text-text-tertiary">{{ row.label }}</dt>
              <dd class="text-right font-medium tabular-nums">{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <div class="border-t border-border-subtle pt-6">
          <RemoveBookButton :title="book.title" @confirm="removeBook" />
        </div>
      </div>
    </div>
  </article>
</template>
