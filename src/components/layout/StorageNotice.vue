<script setup lang="ts">
import { AlertTriangle, Info, X } from '@lucide/vue'
import { useSessionStorage } from '@vueuse/core'
import { useLibraryStore } from '@/stores/library'
import { Button } from '@/components/ui/button'

const library = useLibraryStore()
const memoryNoticeDismissed = useSessionStorage('bookshelf-memory-notice-dismissed', false)
</script>

<template>
  <div v-if="library.status === 'error'" role="alert">
    <div
      class="flex flex-wrap items-center gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3"
    >
      <AlertTriangle class="size-5 shrink-0 text-error" aria-hidden="true" />
      <p class="flex-1">{{ library.loadError }} Try reloading the page.</p>
      <Button size="sm" variant="secondary" @click="library.init()">Try again</Button>
    </div>
  </div>

  <div v-else-if="library.saveError" role="alert">
    <div class="flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3">
      <AlertTriangle class="size-5 shrink-0 text-error" aria-hidden="true" />
      <p class="flex-1">{{ library.saveError }}</p>
      <button
        type="button"
        class="grid size-9 place-items-center rounded-md hover:bg-bg-tertiary"
        aria-label="Dismiss"
        @click="library.saveError = null"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>

  <div
    v-else-if="library.status === 'ready' && !library.isPersistent && !memoryNoticeDismissed"
    role="status"
  >
    <div class="flex items-center gap-3 rounded-lg bg-bg-secondary px-4 py-3 text-text-secondary">
      <Info class="size-5 shrink-0 text-accent" aria-hidden="true" />
      <p class="flex-1">
        Your browser isn't letting us save data, so changes will last only until you close this tab.
      </p>
      <button
        type="button"
        class="grid size-9 place-items-center rounded-md hover:bg-bg-tertiary"
        aria-label="Dismiss"
        @click="memoryNoticeDismissed = true"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
