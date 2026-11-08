<script setup lang="ts">
import { useAnnouncer } from '@/composables/useAnnouncer'

const { message } = useAnnouncer()
</script>

<template>
  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ message }}</div>
</template>
