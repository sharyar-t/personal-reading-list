<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import NewShelfForm from '@/components/shelf/NewShelfForm.vue'
import ShelfRow from '@/components/shelf/ShelfRow.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useLibraryStore } from '@/stores/library'
import { moveByOne } from '@/lib/shelves'

const library = useLibraryStore()
const { announce } = useAnnouncer()

async function create(name: string) {
  const shelf = await library.createShelf(name)
  announce(`Created shelf ${shelf.name}`)
}

async function rename(id: string, name: string) {
  await library.renameShelf(id, name)
  announce(`Renamed shelf to ${library.getShelf(id)?.name}`)
}

async function move(id: string, direction: -1 | 1) {
  const ids = library.sortedShelves.map((shelf) => shelf.id)
  const from = ids.indexOf(id)
  const next = moveByOne(ids, from, direction)
  if (next[from] === ids[from]) return
  const name = library.getShelf(id)?.name
  await library.reorderShelves(next)
  announce(`${name} moved to position ${next.indexOf(id) + 1} of ${ids.length}`)
}

async function remove(id: string) {
  const name = library.getShelf(id)?.name
  await library.deleteShelf(id)
  announce(`Deleted shelf ${name}`)
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      title="Manage shelves"
      description="Create, rename, reorder or remove your shelves. The three defaults stay put."
    />

    <template v-if="library.status === 'ready'">
      <NewShelfForm :create="create" />

      <section aria-labelledby="shelf-order" class="space-y-3">
        <h2 id="shelf-order" class="text-xl font-semibold">Your shelves</h2>
        <TransitionGroup tag="ul" role="list" class="space-y-2" move-class="shelf-move">
          <li v-for="(shelf, index) in library.sortedShelves" :key="shelf.id">
            <ShelfRow
              :shelf="shelf"
              :count="library.countFor(shelf.id)"
              :index="index"
              :total="library.sortedShelves.length"
              :rename="(name) => rename(shelf.id, name)"
              @move="(direction) => move(shelf.id, direction)"
              @delete="remove(shelf.id)"
            />
          </li>
        </TransitionGroup>
      </section>
    </template>

    <p v-else-if="library.status === 'loading'" role="status" class="text-text-secondary">
      Loading your shelves…
    </p>
    <p v-else-if="library.status === 'error'" role="alert" class="text-error">
      {{ library.loadError }}
    </p>
  </div>
</template>

<style scoped>
.shelf-move {
  transition: transform 250ms ease;
}
</style>
