<script setup lang="ts">
import { computed } from 'vue'
import { MONTH_NAMES, type MonthStat } from '@/lib/stats'

const props = defineProps<{
  months: MonthStat[]
  /** Months after this index haven't happened yet (current year only) */
  lastMonthIndex?: number
}>()

const max = computed(() => Math.max(1, ...props.months.map((m) => m.count)))

const bars = computed(() =>
  props.months.map((m) => ({
    ...m,
    short: MONTH_NAMES[m.month]!.slice(0, 3),
    // A book should always be visible, even next to a month with ten
    height: m.count ? Math.max(12, Math.round((m.count / max.value) * 100)) : 0,
    upcoming: props.lastMonthIndex !== undefined && m.month > props.lastMonthIndex,
    label: `${MONTH_NAMES[m.month]}: ${m.count === 1 ? '1 book' : `${m.count} books`}`,
  })),
)
</script>

<template>
  <ol role="list" class="grid h-52 grid-cols-12 gap-1 sm:gap-2">
    <li v-for="bar in bars" :key="bar.month" class="flex min-w-0 flex-col" :title="bar.label">
      <span class="sr-only">{{ bar.label }}</span>
      <div class="flex flex-1 flex-col justify-end gap-1" aria-hidden="true">
        <span
          class="text-center text-xs font-medium tabular-nums"
          :class="bar.count ? 'text-text-secondary' : 'text-transparent'"
        >
          {{ bar.count }}
        </span>
        <div
          class="w-full rounded-t-md transition-[height] duration-700 ease-out"
          :class="
            bar.count
              ? 'bg-progress'
              : bar.upcoming
                ? 'h-px bg-border-subtle'
                : 'h-0.5 rounded-full bg-border'
          "
          :style="bar.count ? { height: `${bar.height}%` } : undefined"
        />
      </div>
      <span
        class="mt-2 text-center text-[0.6875rem] sm:text-xs"
        :class="bar.upcoming ? 'text-text-tertiary/60' : 'text-text-tertiary'"
        aria-hidden="true"
      >
        {{ bar.short }}
      </span>
    </li>
  </ol>
</template>
