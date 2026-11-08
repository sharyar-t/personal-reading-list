<script setup lang="ts">
import { computed } from 'vue'
import { Monitor, Moon, Sun } from '@lucide/vue'
import {
  ToggleGroupItem,
  ToggleGroupRoot,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { THEME_LABELS, useTheme, type ThemePreference } from '@/composables/useTheme'

defineProps<{ collapsed?: boolean }>()

const { preference, next, cycle } = useTheme()

const options = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'auto', icon: Monitor },
] as const satisfies { value: ThemePreference; icon: unknown }[]

const currentIcon = computed(() => options.find((o) => o.value === preference.value)!.icon)

function onSelect(value: unknown) {
  // Single-select groups emit undefined when the active item is clicked again — ignore it.
  if (typeof value === 'string') preference.value = value as ThemePreference
}
</script>

<template>
  <TooltipRoot v-if="collapsed" :delay-duration="200">
    <TooltipTrigger as-child>
      <button
        type="button"
        class="grid size-11 place-items-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        :aria-label="`Theme: ${THEME_LABELS[preference]}. Switch to ${THEME_LABELS[next]}`"
        @click="cycle"
      >
        <component :is="currentIcon" class="size-5" aria-hidden="true" />
      </button>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        side="right"
        :side-offset="8"
        class="z-50 rounded-md bg-text-primary px-2.5 py-1.5 text-sm text-bg-primary shadow-md"
      >
        Theme: {{ THEME_LABELS[preference] }}
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>

  <ToggleGroupRoot
    v-else
    type="single"
    :model-value="preference"
    aria-label="Color theme"
    class="inline-flex rounded-md border border-border bg-bg-secondary p-0.5"
    @update:model-value="onSelect"
  >
    <ToggleGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :aria-label="THEME_LABELS[option.value]"
      class="grid size-9 place-items-center rounded-[calc(var(--radius-md)-2px)] text-text-tertiary transition-colors hover:text-text-primary data-[state=on]:bg-surface data-[state=on]:text-text-primary data-[state=on]:shadow-sm"
    >
      <component :is="option.icon" class="size-4" aria-hidden="true" />
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
