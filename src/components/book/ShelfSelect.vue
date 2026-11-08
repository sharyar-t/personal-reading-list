<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { useLibraryStore } from '@/stores/library'

defineProps<{ modelValue: string; id?: string }>()
const emit = defineEmits<{ 'update:modelValue': [shelfId: string] }>()

const library = useLibraryStore()
</script>

<template>
  <!-- Native select: best keyboard, screen reader and mobile picker support -->
  <div class="relative">
    <select
      :id="id"
      :value="modelValue"
      class="h-11 w-full cursor-pointer appearance-none rounded-md border border-border bg-surface pr-10 pl-3 font-medium shadow-sm hover:border-text-tertiary focus-visible:border-accent"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="shelf in library.sortedShelves" :key="shelf.id" :value="shelf.id">
        {{ shelf.name }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-tertiary"
      aria-hidden="true"
    />
  </div>
</template>
