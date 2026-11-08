<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ create: (name: string) => Promise<unknown> }>()

const name = ref('')
const error = ref('')
const saving = ref(false)
const input = ref<HTMLInputElement>()

async function submit() {
  error.value = ''
  saving.value = true
  try {
    await props.create(name.value)
    name.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : "We couldn't create that shelf. Try again."
    input.value?.focus()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-2" novalidate @submit.prevent="submit">
    <label for="new-shelf" class="block text-sm font-medium">New shelf</label>
    <div class="flex flex-wrap gap-2">
      <input
        id="new-shelf"
        ref="input"
        v-model="name"
        type="text"
        maxlength="40"
        autocomplete="off"
        placeholder="Favorites, Book Club 2026, Lent out…"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? 'new-shelf-error' : undefined"
        class="h-11 min-w-0 flex-1 rounded-md border bg-surface px-4 shadow-sm placeholder:text-text-tertiary focus-visible:border-accent sm:max-w-sm"
        :class="error ? 'border-error' : 'border-border'"
      />
      <Button type="submit" :disabled="saving">
        <Plus aria-hidden="true" />
        Add shelf
      </Button>
    </div>
    <p v-if="error" id="new-shelf-error" role="alert" class="text-sm text-error">{{ error }}</p>
  </form>
</template>
