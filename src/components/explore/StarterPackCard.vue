<script setup lang="ts">
import { Check, LoaderCircle, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import BookCover from '@/components/book/BookCover.vue'
import { useStarterPack } from '@/composables/useStarterPack'
import { useLibraryStore } from '@/stores/library'
import type { StarterPack } from '@/data/starterPacks'

const props = defineProps<{ pack: StarterPack }>()

const library = useLibraryStore()
const { books, missing, owned, adding, failed, addAll } = useStarterPack(props.pack)
</script>

<template>
  <article
    class="flex h-full flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"
  >
    <div class="flex -space-x-3" aria-hidden="true">
      <BookCover
        v-for="book in books.slice(0, 5)"
        :key="book.title"
        :title="book.title"
        :src="book.coverUrl"
        size="S"
        decorative
        class="w-14 shrink-0 rounded-sm ring-2 ring-surface"
      />
      <!-- Keep the card height stable while the catalog loads -->
      <div v-if="!books.length" class="h-21 w-14" />
    </div>

    <div class="flex-1 space-y-1">
      <h3 class="font-heading text-lg font-semibold">{{ pack.title }}</h3>
      <p class="text-text-secondary">{{ pack.blurb }}</p>
      <p v-if="books.length" class="text-sm text-text-tertiary">
        {{ books.length }} books<template v-if="owned"> · {{ owned }} already yours</template>
      </p>
    </div>

    <p
      v-if="books.length && !missing.length"
      class="inline-flex h-11 items-center gap-2 text-sm font-medium text-success"
    >
      <Check class="size-4" aria-hidden="true" />
      All on your shelves
    </p>
    <div v-else class="space-y-2">
      <Button
        variant="secondary"
        class="w-full"
        :disabled="library.status !== 'ready' || adding || !books.length"
        @click="addAll"
      >
        <LoaderCircle v-if="adding" class="animate-spin" aria-hidden="true" />
        <Plus v-else aria-hidden="true" />
        {{
          adding
            ? 'Adding…'
            : owned
              ? `Add the other ${missing.length}`
              : `Add all ${books.length || ''} to Want to Read`.replace('  ', ' ')
        }}
        <span class="sr-only"> from {{ pack.title }}</span>
      </Button>
      <p v-if="failed" class="text-sm text-error" role="alert">
        Something went wrong adding these. Try again.
      </p>
    </div>
  </article>
</template>
