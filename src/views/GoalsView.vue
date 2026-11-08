<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { PartyPopper, Pencil, Target } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Button } from '@/components/ui/button'
import GoalForm from '@/components/goal/GoalForm.vue'
import GoalRing from '@/components/goal/GoalRing.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useLibraryStore } from '@/stores/library'
import { computeGoalProgress, describePace } from '@/lib/goal'

const library = useLibraryStore()
const { announce } = useAnnouncer()

const year = computed(() => new Date().getFullYear())
const goal = computed(() => library.currentGoal)
const progress = computed(() =>
  goal.value
    ? computeGoalProgress(goal.value.target, library.finishedThisYear.length, year.value)
    : null,
)
const pace = computed(() => (progress.value ? describePace(progress.value) : ''))

const editing = ref(false)
const editButton = ref<InstanceType<typeof Button>>()

async function save(target: number) {
  await library.setGoal(target)
}

async function closeForm(saved: boolean) {
  editing.value = false
  if (saved && goal.value) announce(`Goal set to ${goal.value.target} books`)
  await nextTick()
  ;(editButton.value?.$el as HTMLElement | undefined)?.focus()
}

const statusStyle = {
  complete: 'bg-success/15 text-success',
  ahead: 'bg-success/15 text-success',
  'on-track': 'bg-accent-subtle text-accent',
  behind: 'bg-warning/15 text-warning',
} as const

const statusLabel = {
  complete: 'Complete',
  ahead: 'Ahead of pace',
  'on-track': 'On track',
  behind: 'Behind pace',
} as const
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Reading goal" :description="`Your ${year} target, and how you're pacing.`" />

    <template v-if="library.status === 'ready'">
      <!-- No goal yet: an invitation, not a broken dashboard -->
      <EmptyState
        v-if="!goal || !progress"
        :icon="Target"
        :title="`Set a reading goal for ${year}`"
        description="Pick a number of books and see whether you're ahead, on track or behind as the year goes on."
      >
        <GoalForm :year="year" :save="save" class="text-left" @done="announce('Goal saved')" />
      </EmptyState>

      <template v-else>
        <section
          v-if="progress.status === 'complete'"
          aria-labelledby="goal-celebration"
          class="celebrate relative overflow-hidden rounded-xl border border-success/30 bg-success/10 px-6 py-8 text-center sm:px-10"
        >
          <span
            class="mx-auto grid size-14 place-items-center rounded-full bg-success text-white dark:text-bg-primary"
          >
            <PartyPopper class="size-7" aria-hidden="true" />
          </span>
          <h2 id="goal-celebration" class="mt-4 text-3xl font-bold">
            You did it — {{ progress.target }} books in {{ year }}!
          </h2>
          <p class="mx-auto mt-2 max-w-md text-text-secondary">
            <template v-if="progress.read > progress.target">
              And {{ progress.read - progress.target }} more on top.
            </template>
            That's a whole shelf of stories you made time for. Raise the bar, or simply keep
            reading.
          </p>
        </section>

        <section
          aria-labelledby="goal-title"
          class="grid items-center gap-8 rounded-xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8 md:grid-cols-[14rem_1fr] md:gap-12"
        >
          <GoalRing :progress="progress" />

          <div class="space-y-5">
            <div class="space-y-2">
              <h2 id="goal-title" class="text-2xl font-bold">
                {{ progress.read }} of {{ progress.target }} books
              </h2>
              <p
                class="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                :class="statusStyle[progress.status]"
              >
                {{ statusLabel[progress.status] }}
              </p>
              <p class="text-lg text-text-secondary">{{ pace }}</p>
            </div>

            <dl class="grid grid-cols-3 gap-4 border-t border-border-subtle pt-5">
              <div>
                <dt class="text-sm text-text-secondary">Still to go</dt>
                <dd class="font-heading text-2xl font-bold tabular-nums">
                  {{ progress.remaining }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-text-secondary">Days left</dt>
                <dd class="font-heading text-2xl font-bold tabular-nums">
                  {{ progress.daysLeft }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-text-secondary">Pace today</dt>
                <dd class="font-heading text-2xl font-bold tabular-nums">
                  {{ Math.round(progress.expected) }}
                </dd>
              </div>
            </dl>
            <p v-if="progress.status !== 'complete'" class="text-xs text-text-tertiary">
              The dark tick on the ring marks where a steady reader would be today.
            </p>

            <div v-if="!editing" class="flex flex-wrap gap-2">
              <Button ref="editButton" variant="secondary" size="sm" @click="editing = true">
                <Pencil aria-hidden="true" />
                Edit goal
              </Button>
              <Button variant="ghost" size="sm" as-child>
                <RouterLink to="/stats">See your year in review</RouterLink>
              </Button>
            </div>
          </div>
        </section>

        <section
          v-if="editing"
          aria-labelledby="edit-goal"
          class="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm"
        >
          <h2 id="edit-goal" class="sr-only">Edit your goal</h2>
          <GoalForm
            :year="year"
            :initial="goal.target"
            :save="save"
            cancellable
            @done="closeForm(true)"
            @cancel="closeForm(false)"
          />
        </section>
      </template>
    </template>

    <p v-else-if="library.status === 'loading'" role="status" class="text-text-secondary">
      Loading your goal…
    </p>
    <p v-else-if="library.status === 'error'" role="alert" class="text-error">
      {{ library.loadError }}
    </p>
  </div>
</template>

<style scoped>
.celebrate {
  animation: celebrate-in 600ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
@keyframes celebrate-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}
</style>
