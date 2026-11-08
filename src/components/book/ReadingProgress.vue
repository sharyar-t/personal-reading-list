<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { LibraryBook } from '@/types/library'
import { useLibraryStore } from '@/stores/library'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { relativeTime } from '@/lib/dates'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ book: LibraryBook }>()

const library = useLibraryStore()
const { announce } = useAnnouncer()
const inputId = useId()
const errorId = useId()

/** Books without a page count are tracked in percent */
const byPage = computed(() => props.book.pageCount !== null)
const pageCount = computed(() => props.book.pageCount ?? 100)
const percent = computed(() => props.book.progress?.percent ?? 0)
const position = computed(() =>
  byPage.value ? (props.book.progress?.currentPage ?? 0) : percent.value,
)
const pagesLeft = computed(() =>
  byPage.value ? Math.max(0, pageCount.value - position.value) : null,
)
const increments = computed(() => (byPage.value ? [10, 25, 50] : [5, 10, 25]))
const unit = computed(() => (byPage.value ? 'pages' : '%'))

// v-model on a number input yields a number (or '' when empty)
const draft = ref<number | string>('')
const error = ref<string | null>(null)

// Keep the field in sync when progress changes elsewhere (quick buttons, other views)
watch(
  position,
  (value) => {
    draft.value = value
  },
  { immediate: true },
)

async function save(value: number) {
  const max = pageCount.value
  const next = Math.min(max, Math.max(0, Math.round(value)))
  error.value = null
  await library.updateProgress(props.book.id, byPage.value ? { page: next } : { percent: next })
  const updated = library.getBook(props.book.id)?.progress
  if (updated) {
    announce(
      byPage.value
        ? `Progress saved: page ${updated.currentPage} of ${max}, ${updated.percent}%`
        : `Progress saved: ${updated.percent}%`,
    )
  }
}

function submit() {
  const raw = String(draft.value).trim()
  const value = Number(raw)
  if (!raw || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    error.value = byPage.value ? 'Enter a whole page number.' : 'Enter a whole percentage.'
    return
  }
  if (value > pageCount.value) {
    error.value = byPage.value
      ? `This edition has ${pageCount.value} pages.`
      : 'Progress can’t go past 100%.'
    return
  }
  if (value === position.value) return
  save(value)
}

function bump(amount: number) {
  save(position.value + amount)
}
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <div class="flex items-baseline justify-between gap-3">
        <p class="text-lg font-semibold tabular-nums">
          <template v-if="byPage">Page {{ position }} of {{ pageCount }}</template>
          <template v-else>{{ percent }}% read</template>
        </p>
        <p class="font-heading text-2xl font-bold text-accent tabular-nums">{{ percent }}%</p>
      </div>
      <ProgressBar :value="percent" :label="`Reading progress for ${book.title}`" class="h-2.5" />
      <p class="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-text-tertiary">
        <span v-if="pagesLeft !== null">
          {{
            pagesLeft === 0
              ? 'No pages left'
              : `${pagesLeft} ${pagesLeft === 1 ? 'page' : 'pages'} left`
          }}
        </span>
        <span v-else>This edition has no page count, so progress is tracked in percent.</span>
        <span v-if="book.progress">Updated {{ relativeTime(book.progress.updatedAt) }}</span>
      </p>
    </div>

    <form class="flex flex-wrap items-end gap-x-3 gap-y-3" novalidate @submit.prevent="submit">
      <div class="flex flex-col gap-1.5">
        <label :for="inputId" class="text-sm font-medium text-text-secondary">
          {{ byPage ? 'I’m on page' : 'I’m at (%)' }}
        </label>
        <div class="flex gap-2">
          <input
            :id="inputId"
            v-model="draft"
            type="number"
            inputmode="numeric"
            min="0"
            :max="pageCount"
            step="1"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="error ? errorId : undefined"
            class="h-11 w-28 rounded-md border border-border bg-surface px-3 text-base font-medium tabular-nums shadow-sm focus-visible:border-accent aria-invalid:border-error"
          />
          <Button type="submit" variant="secondary">Update</Button>
        </div>
      </div>

      <div class="flex gap-2" role="group" :aria-label="`Add ${unit}`">
        <Button
          v-for="amount in increments"
          :key="amount"
          type="button"
          variant="ghost"
          class="border border-border-subtle bg-bg-secondary tabular-nums"
          :disabled="position >= pageCount"
          :aria-label="byPage ? `Add ${amount} pages` : `Add ${amount}%`"
          @click="bump(amount)"
        >
          +{{ amount }}{{ byPage ? '' : '%' }}
        </Button>
      </div>
    </form>
    <p v-if="error" :id="errorId" class="-mt-2 text-sm text-error" role="alert">{{ error }}</p>
  </div>
</template>
