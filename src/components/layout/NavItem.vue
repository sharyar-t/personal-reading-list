<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'

defineProps<{
  to: RouteLocationRaw
  label: string
  icon: Component
  count?: number
  collapsed?: boolean
}>()
</script>

<template>
  <TooltipRoot :disabled="!collapsed" :delay-duration="200">
    <TooltipTrigger as-child>
      <RouterLink
        :to="to"
        class="group flex min-h-11 items-center gap-3 rounded-md px-3 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary aria-[current=page]:bg-accent-subtle aria-[current=page]:font-medium aria-[current=page]:text-accent"
        :class="collapsed && 'justify-center px-0'"
      >
        <component :is="icon" class="size-5 shrink-0" aria-hidden="true" />
        <span :class="collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate'">{{ label }}</span>
        <span
          v-if="count !== undefined && !collapsed"
          class="text-sm text-text-tertiary tabular-nums group-aria-[current=page]:text-accent"
        >
          {{ count }}
          <span class="sr-only">{{ count === 1 ? 'book' : 'books' }}</span>
        </span>
      </RouterLink>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        side="right"
        :side-offset="8"
        class="z-50 animate-in rounded-md bg-text-primary px-2.5 py-1.5 text-sm text-bg-primary shadow-md fade-in-0 zoom-in-95"
      >
        {{ label }}<template v-if="count !== undefined"> · {{ count }}</template>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
