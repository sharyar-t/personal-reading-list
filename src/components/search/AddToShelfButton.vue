<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, type ComponentPublicInstance } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, ChevronDown, LoaderCircle, Plus } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { useLibraryStore, FALLBACK_SHELF_ID } from '@/stores/library'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useAddFromSearch } from '@/composables/useAddFromSearch'
import type { SearchResult } from '@/services/openLibrary/normalize'

const props = defineProps<{ result: SearchResult }>()

const library = useLibraryStore()
const { announce } = useAnnouncer()
const { addFromSearch } = useAddFromSearch()

const badge = useTemplateRef<ComponentPublicInstance>('badge')
const adding = ref(false)
const failed = ref(false)

const existing = computed(() =>
  library.findInLibrary({ ...props.result.metadata, isbns: props.result.isbns }),
)
const existingShelf = computed(() =>
  existing.value ? library.getShelf(existing.value.shelfId) : undefined,
)
const defaultShelf = computed(() => library.getShelf(FALLBACK_SHELF_ID))
const otherShelves = computed(() =>
  library.sortedShelves.filter((shelf) => shelf.id !== FALLBACK_SHELF_ID),
)
const ready = computed(() => library.status === 'ready')

/**
 * The add controls are replaced by the "On <shelf>" badge, so the focused
 * button disappears. If focus fell back to <body>, move it to the badge so
 * keyboard users keep their place in the results.
 */
async function restoreFocus() {
  await nextTick()
  // Let the menu finish closing (it tries to refocus its now-removed trigger)
  await new Promise((resolve) => requestAnimationFrame(resolve))
  const active = document.activeElement
  if (!active || active === document.body || !active.isConnected) {
    ;(badge.value?.$el as HTMLElement | undefined)?.focus()
  }
}

async function add(shelfId: string) {
  if (adding.value) return
  adding.value = true
  failed.value = false
  try {
    const { added, book } = await addFromSearch(props.result, shelfId)
    restoreFocus()
    const shelf = library.getShelf(book.shelfId)?.name ?? 'your library'
    announce(added ? `Added ${book.title} to ${shelf}` : `${book.title} is already on ${shelf}`)
  } catch (error) {
    console.error('[bookshelf] Could not add book', error)
    failed.value = true
    announce(`Couldn't add ${props.result.metadata.title}. Please try again.`)
  } finally {
    adding.value = false
  }
}

const segment =
  'inline-flex h-10 items-center gap-1.5 bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 dark:text-bg-primary [&_svg]:size-4'
</script>

<template>
  <RouterLink
    v-if="existing"
    ref="badge"
    :to="{ name: 'book', params: { bookId: existing.id } }"
    class="inline-flex h-10 items-center gap-1.5 rounded-md bg-success/10 px-3 text-sm font-medium text-success hover:bg-success/15"
  >
    <Check class="size-4" aria-hidden="true" />
    <span>
      <span class="sr-only">{{ result.metadata.title }} is </span>On
      {{ existingShelf?.name ?? 'your shelf' }}
    </span>
  </RouterLink>

  <div v-else class="flex flex-col items-start gap-1 sm:items-end">
    <div class="inline-flex rounded-md shadow-sm">
      <button
        type="button"
        :class="[segment, 'rounded-l-md px-3']"
        :disabled="!ready || adding"
        :aria-label="`Add ${result.metadata.title} to ${defaultShelf?.name ?? 'Want to Read'}`"
        @click="add(FALLBACK_SHELF_ID)"
      >
        <LoaderCircle v-if="adding" class="animate-spin" aria-hidden="true" />
        <Plus v-else aria-hidden="true" />
        {{ defaultShelf?.name ?? 'Want to Read' }}
      </button>

      <DropdownMenuRoot>
        <DropdownMenuTrigger
          :class="[segment, 'rounded-r-md border-l border-white/25 px-2']"
          :disabled="!ready || adding"
          :aria-label="`Choose a shelf for ${result.metadata.title}`"
        >
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            align="end"
            :side-offset="6"
            class="z-50 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <DropdownMenuLabel class="px-2.5 py-1.5 text-xs font-semibold text-text-tertiary">
              Add to shelf
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="shelf in otherShelves"
              :key="shelf.id"
              class="flex min-h-10 cursor-pointer items-center rounded-md px-2.5 text-sm outline-none data-highlighted:bg-accent-subtle data-highlighted:text-accent"
              @select="add(shelf.id)"
            >
              {{ shelf.name }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
    <p v-if="failed" class="text-sm text-error">Couldn't add — try again.</p>
  </div>
</template>
