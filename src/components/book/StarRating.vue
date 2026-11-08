<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Star } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    label?: string
    /** Visually hide the legend (it stays available to screen readers) */
    hideLabel?: boolean
  }>(),
  { label: 'Your rating', hideLabel: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const name = useId()
const hovered = ref<number | null>(null)
const shown = computed(() => hovered.value ?? props.modelValue ?? 0)

const LABELS = ['Didn’t like it', 'It was OK', 'Liked it', 'Really liked it', 'Loved it']
const caption = computed(() => (shown.value ? LABELS[shown.value - 1] : 'Not rated yet'))
</script>

<template>
  <fieldset class="min-w-0">
    <legend :class="hideLabel ? 'sr-only' : 'mb-1.5 text-sm font-medium text-text-secondary'">
      {{ label }}
    </legend>
    <!-- Native radios: arrow keys, focus and announcements work out of the box -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div class="-ml-2 flex" @mouseleave="hovered = null">
        <label
          v-for="star in 5"
          :key="star"
          class="group grid size-11 cursor-pointer place-items-center rounded-md has-focus-visible:outline-2 has-focus-visible:outline-accent"
          @mouseenter="hovered = star"
        >
          <input
            type="radio"
            class="sr-only"
            :name="name"
            :value="star"
            :checked="modelValue === star"
            @change="emit('update:modelValue', star)"
          />
          <span class="sr-only">{{ star }} {{ star === 1 ? 'star' : 'stars' }}</span>
          <Star
            class="size-6 transition-transform duration-150 group-hover:scale-110"
            :class="star <= shown ? 'fill-rating text-rating' : 'text-border'"
            aria-hidden="true"
          />
        </label>
      </div>
      <span class="text-sm text-text-tertiary" aria-hidden="true">{{ caption }}</span>
      <button
        v-if="modelValue"
        type="button"
        class="text-sm text-text-tertiary underline-offset-2 hover:text-text-primary hover:underline"
        @click="emit('update:modelValue', null)"
      >
        Clear<span class="sr-only"> rating</span>
      </button>
    </div>
  </fieldset>
</template>
