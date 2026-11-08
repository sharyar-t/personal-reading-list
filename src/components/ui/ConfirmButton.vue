<script setup lang="ts">
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

withDefaults(
  defineProps<{
    label: string
    title: string
    description: string
    confirmLabel: string
    cancelLabel?: string
    destructive?: boolean
    disabled?: boolean
  }>(),
  { cancelLabel: 'Cancel' },
)
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger
      :disabled="disabled"
      :class="
        cn(
          buttonVariants({ variant: 'secondary' }),
          destructive && 'text-error hover:bg-error/10 hover:text-error',
        )
      "
    >
      <slot name="icon" />
      {{ label }}
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <AlertDialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-1/2 rounded-xl bg-surface p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
      >
        <AlertDialogTitle class="font-heading text-xl font-bold">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription class="mt-2 text-text-secondary">
          {{ description }}
        </AlertDialogDescription>
        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <AlertDialogCancel :class="buttonVariants({ variant: 'secondary' })">
            {{ cancelLabel }}
          </AlertDialogCancel>
          <AlertDialogAction
            :class="
              cn(buttonVariants(), destructive && 'bg-error hover:bg-error/90 dark:text-white')
            "
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
