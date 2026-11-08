<script setup lang="ts">
import { ChartColumn } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Year in review" />
    <EmptyState
      :icon="ChartColumn"
      title="Coming soon"
      description="Books per month, genres, pages and pace — your reading year as a story."
    />
  </div>
</template>
