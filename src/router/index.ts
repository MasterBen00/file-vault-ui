/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import { setupLayouts } from 'virtual:generated-layouts'
// Composables
// eslint-disable-next-line import/no-duplicates
import { createRouter, createWebHistory } from 'vue-router/auto'
// eslint-disable-next-line import/no-duplicates
import { routes } from 'vue-router/auto-routes'
import { useAuthStore } from '@/stores/authStore' // Import the auth store

// Define Super Admin routes
const superAdminRoutes = [
  {
    path: '/superadmin',
    component: () => import('@/layouts/SuperAdminLayout.vue'),
    meta: { requiresAuth: true, requiresRole: 'ROLE_SUPER_ADMIN' },
    children: [
      {
        path: 'dashboard',
        name: 'SuperAdminDashboard',
        component: () => import('@/pages/superadmin/SuperAdminDashboard.vue'),
      },
      {
        path: 'users',
        name: 'SuperAdminUserManagement',
        component: () => import('@/pages/superadmin/UserManagement.vue'),
      },
      {
        path: 'roles',
        name: 'SuperAdminRoleManagement',
        component: () => import('@/pages/superadmin/RoleManagement.vue'),
      },
      {
        path: 'organizations',
        name: 'SuperAdminOrganizationManagement',
        component: () => import('@/pages/superadmin/OrganizationManagement.vue'),
      },
      {
        path: 'settings',
        name: 'SuperAdminSystemSettings',
        component: () => import('@/pages/superadmin/SystemSettings.vue'),
      },
      {
        path: 'audit-logs',
        name: 'SuperAdminAuditLogs',
        component: () => import('@/pages/superadmin/AuditLogViewer.vue'),
      },
      // Redirect /superadmin to /superadmin/dashboard
      {
        path: '',
        redirect: '/superadmin/dashboard',
      },
    ],
  },
]

// Define dashboard route with admin protection
const dashboardRoute = {
  path: '/dashboard',
  name: 'dashboard',
  component: () => import('@/pages/dashboard.vue'),
  meta: {
    requiresAuth: true,
    requiresRole: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
  },
}

// 404 route - must be last
const notFoundRoute = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/pages/NotFound.vue'),
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts([...routes.filter(route => route.path !== '/dashboard'), dashboardRoute, ...superAdminRoutes, notFoundRoute]), // Filter out auto-generated dashboard route
})

// Navigation guard
router.beforeEach(async (to, from, next) => { // Make the guard async
  const authStore = useAuthStore()

  // Ensure user info is attempted to be fetched if a token exists but user is not loaded
  // This is important for direct navigation to protected routes after page refresh
  if (authStore.token && !authStore.currentUser) {
    await authStore.fetchUser()
  }

  const isAuthenticated = authStore.isAuthenticated
  const userRoles = authStore.currentUser?.roles || new Set()

  // Check for routes requiring specific roles
  if (to.meta.requiresRole) {
    if (!isAuthenticated) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }

    // Check if requiresRole is an array or a single string
    const requiredRoles = Array.isArray(to.meta.requiresRole)
      ? to.meta.requiresRole as string[]
      : [to.meta.requiresRole as string]

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => userRoles.has(role))

    if (!hasRequiredRole) {
      // User does not have the required role
      console.warn(`User does not have the required roles: ${requiredRoles.join(', ')}. Current roles: ${Array.from(userRoles).join(', ')}`)

      // If trying to access dashboard without proper permissions, show 404
      if (to.path === '/dashboard') {
        return next({ name: 'NotFound' })
      }

      return next('/') // Redirect to home page for other unauthorized access attempts
    }
  }

  const publicPages = ['/login', '/register', '/', '/verify-email', '/maintenance'] // Added '/maintenance'
  const authRequired = !publicPages.includes(to.path) && !to.matched.some(record => record.path.startsWith('/superadmin')) // Adjust public pages logic if superadmin is handled by meta fields

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Fallback for general authRequired pages not covered by meta.requiresRole or meta.requiresAuth
  // This might be redundant if all protected routes use meta fields.
  if (authRequired && !isAuthenticated && !to.meta.requiresRole) {
    return next('/login')
  }

  // If user is authenticated and tries to access login or register, redirect to dashboard
  if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return next('/dashboard')
  }

  next()
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
