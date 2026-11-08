<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

defineProps<{ name: string; bookCount: number }>()
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger
      :class="
        cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'text-text-secondary hover:bg-error/10 hover:text-error',
        )
      "
    >
      <Trash2 aria-hidden="true" />
      <span class="sr-only">Delete shelf {{ name }}</span>
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <AlertDialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-1/2 rounded-xl bg-surface p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
      >
        <AlertDialogTitle class="font-heading text-xl font-bold">
          Delete “{{ name }}”?
        </AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-text-secondary">
          <template v-if="bookCount">
            Your {{ bookCount }} {{ bookCount === 1 ? 'book' : 'books' }}
            will move to Want to Read — nothing is removed from your library.
          </template>
          <template v-else>This shelf is empty, so nothing else changes.</template>
        </AlertDialogDescription>
        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <AlertDialogCancel :class="buttonVariants({ variant: 'secondary' })">
            Keep shelf
          </AlertDialogCancel>
          <AlertDialogAction
            :class="cn(buttonVariants(), 'bg-error hover:bg-error/90 dark:text-white')"
            @click="emit('confirm')"
          >
            Delete shelf
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
