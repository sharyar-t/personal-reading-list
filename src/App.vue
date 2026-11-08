<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { TooltipProvider } from 'reka-ui'
import AppLayout from '@/components/layout/AppLayout.vue'
import LiveAnnouncer from '@/components/ui/LiveAnnouncer.vue'
import { useTheme } from '@/composables/useTheme'

// Keeps <html data-theme> in sync with the stored preference and system changes
useTheme()

const route = useRoute()
const isAppShell = computed(() => route.meta.layout !== 'blank')
</script>

<template>
  <TooltipProvider>
    <AppLayout v-if="isAppShell">
      <RouterView />
    </AppLayout>
    <RouterView v-else />
    <LiveAnnouncer />
  </TooltipProvider>
</template>
