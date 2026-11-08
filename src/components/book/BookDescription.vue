<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = defineProps<{ text: string }>()

const COLLAPSE_AFTER = 600
const expanded = ref(false)
const id = useId()
const long = computed(() => props.text.length > COLLAPSE_AFTER)
</script>

<template>
  <div>
    <div
      :id="id"
      class="relative leading-relaxed whitespace-pre-line text-text-secondary"
      :class="long && !expanded && 'line-clamp-6'"
    >
      {{ text }}
    </div>
    <button
      v-if="long"
      type="button"
      class="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
      :aria-expanded="expanded"
      :aria-controls="id"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Read more' }}
    </button>
  </div>
</template>
