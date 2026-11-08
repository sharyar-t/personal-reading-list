<script setup lang="ts">
import { Target } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Reading goal" />
    <EmptyState
      :icon="Target"
      title="Coming soon"
      description="Set a yearly target and see whether you're on pace."
    />
  </div>
</template>
