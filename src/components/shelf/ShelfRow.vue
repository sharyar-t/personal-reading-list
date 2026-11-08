<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowDown, ArrowUp, Check, Pencil, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import DeleteShelfButton from '@/components/shelf/DeleteShelfButton.vue'
import type { Shelf } from '@/types/library'

const props = defineProps<{
  shelf: Shelf
  count: number
  index: number
  total: number
  rename: (name: string) => Promise<void>
}>()
const emit = defineEmits<{ move: [direction: -1 | 1]; delete: [] }>()

const editing = ref(false)
const draft = ref('')
const error = ref('')
const input = ref<HTMLInputElement>()
const renameButton = ref<InstanceType<typeof Button>>()

async function startEditing() {
  draft.value = props.shelf.name
  error.value = ''
  editing.value = true
  await nextTick()
  input.value?.select()
}

async function stopEditing() {
  editing.value = false
  await nextTick()
  ;(renameButton.value?.$el as HTMLElement | undefined)?.focus()
}

async function save() {
  try {
    await props.rename(draft.value)
    await stopEditing()
  } catch (e) {
    error.value = e instanceof Error ? e.message : "We couldn't rename that shelf. Try again."
    input.value?.focus()
  }
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 shadow-sm"
  >
    <div class="flex">
      <!-- aria-disabled (not disabled) keeps focus on the button after it reaches an edge -->
      <Button
        variant="ghost"
        size="icon"
        :aria-disabled="index === 0"
        :class="index === 0 && 'pointer-events-none opacity-40'"
        @click="emit('move', -1)"
      >
        <ArrowUp aria-hidden="true" />
        <span class="sr-only">Move {{ shelf.name }} up</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-disabled="index === total - 1"
        :class="index === total - 1 && 'pointer-events-none opacity-40'"
        @click="emit('move', 1)"
      >
        <ArrowDown aria-hidden="true" />
        <span class="sr-only">Move {{ shelf.name }} down</span>
      </Button>
    </div>

    <form v-if="editing" class="min-w-0 flex-1 space-y-1" novalidate @submit.prevent="save">
      <div class="flex flex-wrap items-center gap-2">
        <label :for="`rename-${shelf.id}`" class="sr-only">Shelf name</label>
        <input
          :id="`rename-${shelf.id}`"
          ref="input"
          v-model="draft"
          type="text"
          maxlength="40"
          autocomplete="off"
          :aria-invalid="Boolean(error)"
          :aria-describedby="error ? `rename-error-${shelf.id}` : undefined"
          class="h-11 min-w-0 flex-1 rounded-md border bg-bg-primary px-3 focus-visible:border-accent"
          :class="error ? 'border-error' : 'border-border'"
          @keydown.esc.prevent="stopEditing"
        />
        <Button type="submit" size="icon">
          <Check aria-hidden="true" />
          <span class="sr-only">Save name</span>
        </Button>
        <Button type="button" variant="ghost" size="icon" @click="stopEditing">
          <X aria-hidden="true" />
          <span class="sr-only">Cancel rename</span>
        </Button>
      </div>
      <p v-if="error" :id="`rename-error-${shelf.id}`" role="alert" class="text-sm text-error">
        {{ error }}
      </p>
    </form>

    <template v-else>
      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'shelf', params: { shelfId: shelf.id } }"
          class="block truncate font-medium hover:text-accent"
        >
          {{ shelf.name }}
        </RouterLink>
        <p class="flex items-center gap-2 text-sm whitespace-nowrap text-text-tertiary">
          <span class="tabular-nums">{{ count }} {{ count === 1 ? 'book' : 'books' }}</span>
          <span v-if="shelf.isDefault" class="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-xs">
            Default
          </span>
        </p>
      </div>

      <div v-if="!shelf.isDefault" class="flex">
        <Button ref="renameButton" variant="ghost" size="icon" @click="startEditing">
          <Pencil aria-hidden="true" />
          <span class="sr-only">Rename shelf {{ shelf.name }}</span>
        </Button>
        <DeleteShelfButton :name="shelf.name" :book-count="count" @confirm="emit('delete')" />
      </div>
    </template>
  </div>
</template>
