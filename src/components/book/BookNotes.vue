<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Check, LoaderCircle } from '@lucide/vue'
import type { LibraryBook } from '@/types/library'
import { useLibraryStore } from '@/stores/library'

const props = defineProps<{ book: LibraryBook }>()

const library = useLibraryStore()
const id = useId()
const draft = ref(props.book.notes)
const state = ref<'idle' | 'pending' | 'saved'>('idle')

// Another book (same component reused across routes) — start from its notes
watch(
  () => props.book.id,
  () => {
    draft.value = props.book.notes
    state.value = 'idle'
  },
)

async function save() {
  if (draft.value === props.book.notes) {
    if (state.value === 'pending') state.value = 'saved'
    return
  }
  await library.setNotes(props.book.id, draft.value)
  state.value = 'saved'
}

const saveSoon = useDebounceFn(save, 800)

function onInput() {
  state.value = 'pending'
  saveSoon()
}

// Don't lose the last keystrokes when navigating away mid-debounce
onBeforeUnmount(() => {
  const current = library.getBook(props.book.id)
  if (current && draft.value !== current.notes) library.setNotes(current.id, draft.value)
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-3">
      <label :for="id" class="sr-only">Your notes about {{ book.title }}</label>
      <span class="text-sm text-text-tertiary" aria-live="polite">
        <span v-if="state === 'pending'" class="inline-flex items-center gap-1.5">
          <LoaderCircle class="size-3.5 animate-spin" aria-hidden="true" /> Saving…
        </span>
        <span v-else-if="state === 'saved'" class="inline-flex items-center gap-1.5 text-success">
          <Check class="size-3.5" aria-hidden="true" /> Saved
        </span>
        <span v-else>Notes save automatically.</span>
      </span>
    </div>
    <textarea
      :id="id"
      v-model="draft"
      rows="5"
      placeholder="Favorite quotes, thoughts, who recommended it…"
      class="field-sizing-content min-h-32 w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 leading-relaxed shadow-sm placeholder:text-text-tertiary focus-visible:border-accent"
      @input="onInput"
      @blur="save"
    />
  </div>
</template>
