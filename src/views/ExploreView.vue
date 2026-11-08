<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CloudOff, Search } from '@lucide/vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'
import StarterPackCard from '@/components/explore/StarterPackCard.vue'
import TrendingCard from '@/components/explore/TrendingCard.vue'
import { useTrending } from '@/composables/useTrending'
import { useLibraryStore } from '@/stores/library'
import { STARTER_PACKS } from '@/data/starterPacks'
import { TRENDING_PERIODS, type TrendingPeriod } from '@/services/openLibrary/trending'

const library = useLibraryStore()
const period = ref<TrendingPeriod>('weekly')
const trending = useTrending(period)

/** A new reader needs a first shelf more than a leaderboard, so packs lead for small libraries */
const packsFirst = computed(() => library.status === 'ready' && library.books.length < 5)
// Real DOM order (not CSS reordering) so keyboard and screen-reader order match what is seen
const order = computed(() => (packsFirst.value ? ['packs', 'trending'] : ['trending', 'packs']))

function onPeriodChange(value: unknown) {
  if (typeof value === 'string' && value) period.value = value as TrendingPeriod
}

const periodLabel = computed(
  () => TRENDING_PERIODS.find((p) => p.value === period.value)?.label.toLowerCase() ?? '',
)
</script>

<template>
  <div class="space-y-12">
    <PageHeader
      title="Explore"
      description="Find your next read — what everyone is picking up, and ready-made shelves to start from."
    >
      <template #actions>
        <Button as-child variant="secondary">
          <RouterLink to="/search"><Search aria-hidden="true" />Search books</RouterLink>
        </Button>
      </template>
    </PageHeader>

    <template v-for="section in order" :key="section">
      <section v-if="section === 'trending'" aria-labelledby="trending-title" class="space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="trending-title" class="text-xl font-semibold">Trending on Open Library</h2>
            <p class="text-text-secondary">What readers have been picking up {{ periodLabel }}.</p>
          </div>
          <ToggleGroupRoot
            type="single"
            :model-value="period"
            aria-label="Trending period"
            class="inline-flex rounded-md border border-border bg-surface p-0.5 shadow-sm"
            @update:model-value="onPeriodChange"
          >
            <ToggleGroupItem
              v-for="option in TRENDING_PERIODS"
              :key="option.value"
              :value="option.value"
              class="h-9 rounded px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary data-[state=on]:bg-accent data-[state=on]:text-white dark:data-[state=on]:text-bg-primary"
            >
              {{ option.label }}
            </ToggleGroupItem>
          </ToggleGroupRoot>
        </div>

        <p class="sr-only" role="status">
          {{ trending.status.value === 'loading' ? 'Loading trending books…' : '' }}
        </p>

        <EmptyState
          v-if="trending.status.value === 'error'"
          :icon="CloudOff"
          title="Trending isn't available right now"
          :description="trending.error.value ?? ''"
        >
          <Button variant="secondary" @click="trending.retry()">Try again</Button>
        </EmptyState>

        <ul
          v-else-if="trending.status.value === 'loading'"
          aria-hidden="true"
          class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-5 gap-y-8"
        >
          <li v-for="n in 8" :key="n" class="animate-pulse space-y-3">
            <div class="aspect-2/3 rounded-sm bg-bg-tertiary" />
            <div class="h-4 w-4/5 rounded bg-bg-tertiary" />
            <div class="h-3.5 w-3/5 rounded bg-bg-tertiary" />
          </li>
        </ul>

        <ul
          v-else
          role="list"
          class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-5 gap-y-8"
        >
          <li
            v-for="(result, index) in trending.results.value"
            :key="result.metadata.workKey ?? result.metadata.title"
          >
            <TrendingCard :result="result" :rank="index + 1" />
          </li>
        </ul>
      </section>

      <section v-else aria-labelledby="packs-title" class="space-y-5">
        <div>
          <h2 id="packs-title" class="text-xl font-semibold">Start a shelf</h2>
          <p class="text-text-secondary">
            One click adds a hand-picked set to Want to Read. Books you already have are skipped.
          </p>
        </div>
        <ul role="list" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <li v-for="pack in STARTER_PACKS" :key="pack.id">
            <StarterPackCard :pack="pack" />
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
