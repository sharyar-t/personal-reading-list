<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  year: number
  initial?: number
  /** Resolves when saved; throws with a user-facing message otherwise */
  save: (target: number) => Promise<void>
  cancellable?: boolean
}>()
const emit = defineEmits<{ done: []; cancel: [] }>()

const PRESETS = [12, 24, 36, 52]

const value = ref(props.initial ? String(props.initial) : '')
const error = ref('')
const saving = ref(false)
const input = ref<HTMLInputElement>()

onMounted(() => {
  if (props.initial) nextTick(() => input.value?.select())
})

async function submit() {
  const target = Number(value.value)
  if (!Number.isInteger(target) || target < 1 || target > 999) {
    error.value = 'Choose a whole number between 1 and 999.'
    input.value?.focus()
    return
  }
  error.value = ''
  saving.value = true
  try {
    await props.save(target)
    emit('done')
  } catch (e) {
    error.value = e instanceof Error ? e.message : "We couldn't save your goal. Try again."
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <div>
      <label for="goal-target" class="block text-sm font-medium">
        How many books do you want to read in {{ year }}?
      </label>
      <input
        id="goal-target"
        ref="input"
        v-model="value"
        type="number"
        inputmode="numeric"
        min="1"
        max="999"
        step="1"
        placeholder="24"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? 'goal-error' : undefined"
        class="mt-2 h-12 w-full max-w-48 rounded-md border bg-surface px-4 text-lg tabular-nums shadow-sm placeholder:text-text-tertiary focus-visible:border-accent"
        :class="error ? 'border-error' : 'border-border'"
      />
      <p v-if="error" id="goal-error" role="alert" class="mt-2 text-sm text-error">{{ error }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Suggested goals">
      <span class="text-sm text-text-secondary">Popular:</span>
      <button
        v-for="n in PRESETS"
        :key="n"
        type="button"
        class="h-9 min-w-11 rounded-full border border-border bg-surface px-3 text-sm font-medium tabular-nums transition-colors hover:bg-bg-tertiary"
        :class="Number(value) === n && 'border-accent bg-accent-subtle text-accent'"
        @click="value = String(n)"
      >
        {{ n }}
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button type="submit" :disabled="saving">{{ initial ? 'Save goal' : 'Set my goal' }}</Button>
      <Button v-if="cancellable" type="button" variant="ghost" @click="emit('cancel')">
        Cancel
      </Button>
    </div>
  </form>
</template>
