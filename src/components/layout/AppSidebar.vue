<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import AppLogo from './AppLogo.vue'
import SidebarNav from './SidebarNav.vue'
import ThemeToggle from './ThemeToggle.vue'

const collapsed = defineModel<boolean>('collapsed', { default: false })
</script>

<template>
  <aside
    class="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border-subtle bg-bg-secondary transition-[width] duration-200 lg:flex"
    :class="collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'"
  >
    <div class="flex h-16 items-center px-4" :class="collapsed && 'justify-center px-0'">
      <AppLogo to="/library" :compact="collapsed" />
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-4">
      <SidebarNav :collapsed="collapsed" />
    </div>

    <div
      class="flex items-center gap-2 border-t border-border-subtle p-3"
      :class="collapsed ? 'flex-col' : 'justify-between'"
    >
      <ThemeToggle :collapsed="collapsed" />
      <button
        type="button"
        class="grid size-11 place-items-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <component
          :is="collapsed ? PanelLeftOpen : PanelLeftClose"
          class="size-5"
          aria-hidden="true"
        />
      </button>
    </div>
  </aside>
</template>
