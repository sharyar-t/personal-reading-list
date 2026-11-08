<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eraser, RotateCcw } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmButton from '@/components/ui/ConfirmButton.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useLibraryStore } from '@/stores/library'

const library = useLibraryStore()
const router = useRouter()
const { announce } = useAnnouncer()

const busy = ref(false)
const error = ref('')

async function run(action: () => Promise<void>, done: string) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await action()
    announce(done)
    // Land where the result is visible: the empty-library welcome, or the sample shelves
    await router.push('/library')
  } catch (caught) {
    console.error('[bookshelf] Could not replace the library', caught)
    error.value = 'Something went wrong and your library was left as it was. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-8">
    <PageHeader
      title="Settings"
      description="Your library lives in this browser. Reset it whenever you like."
    />

    <template v-if="library.status === 'ready'">
      <section
        aria-labelledby="library-data"
        class="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface shadow-sm"
      >
        <h2 id="library-data" class="px-5 pt-5 pb-3 text-xl font-semibold sm:px-6">Library data</h2>

        <div class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div class="flex-1 space-y-1">
            <h3 class="font-semibold">Start fresh</h3>
            <p class="text-text-secondary">
              Clear every book, note, rating, goal and custom shelf, and begin with an empty
              library.
            </p>
          </div>
          <ConfirmButton
            label="Start fresh"
            title="Clear your whole library?"
            :description="`All ${library.books.length} books, along with your notes, ratings, reading progress, goals and custom shelves, will be deleted. This can’t be undone.`"
            confirm-label="Clear library"
            cancel-label="Keep my library"
            destructive
            :disabled="busy"
            @confirm="run(() => library.startFresh(), 'Library cleared')"
          >
            <template #icon><Eraser class="size-5" aria-hidden="true" /></template>
          </ConfirmButton>
        </div>

        <div class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div class="flex-1 space-y-1">
            <h3 class="font-semibold">Restore sample library</h3>
            <p class="text-text-secondary">
              Replace everything with the 45 sample books, shelves, progress and reading goal.
            </p>
          </div>
          <ConfirmButton
            label="Restore sample"
            title="Replace your library with the sample?"
            description="Your current books, notes, ratings, goals and shelves will be replaced by the sample library. This can’t be undone."
            confirm-label="Replace library"
            cancel-label="Keep my library"
            destructive
            :disabled="busy"
            @confirm="run(() => library.resetToSample(), 'Sample library restored')"
          >
            <template #icon><RotateCcw class="size-5" aria-hidden="true" /></template>
          </ConfirmButton>
        </div>
      </section>

      <p v-if="error" role="alert" class="text-error">{{ error }}</p>
    </template>

    <p v-else-if="library.status === 'loading'" role="status" class="text-text-secondary">
      Loading…
    </p>
    <p v-else-if="library.status === 'error'" role="alert" class="text-error">
      {{ library.loadError }}
    </p>
  </div>
</template>
