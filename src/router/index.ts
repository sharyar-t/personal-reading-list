import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Page title; views with dynamic titles override it themselves */
    title?: string
    /** Which shell wraps the page */
    layout?: 'app' | 'blank'
  }
}

const APP_NAME = 'Bookshelf'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { layout: 'blank' },
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue'),
      meta: { title: 'Library' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: 'Find books' },
    },
    {
      path: '/shelves/:shelfId',
      name: 'shelf',
      component: () => import('@/views/ShelfView.vue'),
      props: true,
      meta: { title: 'Shelf' },
    },
    {
      path: '/books/:bookId',
      name: 'book',
      component: () => import('@/views/BookDetailView.vue'),
      props: true,
      meta: { title: 'Book' },
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue'),
      meta: { title: 'Year in review' },
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('@/views/GoalsView.vue'),
      meta: { title: 'Reading goal' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Page not found', layout: 'blank' },
    },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · ${APP_NAME}`
    : `${APP_NAME} — Your reading life, beautifully organized`
})

export default router
