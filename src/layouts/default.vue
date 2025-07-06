<template>
  <v-app-bar app color="primary" dark>
    <v-app-bar-nav-icon v-if="authStore.isAuthenticated" @click="drawer = !drawer" />
    <v-toolbar-title style="cursor: pointer;" @click="$router.push('/')">FileSharer</v-toolbar-title>
    <v-spacer />

    <div class="d-flex align-center mr-4">
      <template v-if="!authStore.isAuthenticated">
        <v-btn text to="/login">Sign In</v-btn>
        <v-btn text to="/register">Sign Up</v-btn>
      </template>
      <template v-else>
        <v-btn v-if="isAdmin" class="mr-2" text to="/dashboard">Dashboard</v-btn>
        <v-btn
          v-if="isSuperAdmin"
          class="mr-2"
          prepend-icon="mdi-shield-crown"
          text
          to="/superadmin/dashboard"
        >
          Super Admin
        </v-btn>
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn text v-bind="props">
              {{ authStore.username }}
              <v-icon right>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item to="/profile">
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            <v-list-item @click="authStore.logout">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </div>
  </v-app-bar>

  <v-navigation-drawer v-if="authStore.isAuthenticated" v-model="drawer" app temporary>
    <v-list dense nav>
      <v-list-item prepend-icon="mdi-home" title="Home" to="/" />
      <v-list-item v-if="isAdmin" prepend-icon="mdi-view-dashboard" title="Dashboard" to="/dashboard" />
      <v-list-subheader>Features</v-list-subheader>
      <v-list-item
        v-for="feature in features"
        :key="feature.title"
        :prepend-icon="feature.icon"
        :title="feature.title"
        :to="feature.to"
      />
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <router-view />
  </v-main>

  <AppFooter />
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import AppFooter from '@/components/AppFooter.vue'
  import { useAuthStore } from '@/stores/authStore'

  const drawer = ref(false)
  const authStore = useAuthStore()

  const isSuperAdmin = computed(() =>
    authStore.isAuthenticated && authStore.currentUser?.roles?.has('ROLE_SUPER_ADMIN'),
  )

  const isAdmin = computed(() =>
    authStore.isAuthenticated && (authStore.currentUser?.roles?.has('ROLE_ADMIN')
      || authStore.currentUser?.roles?.has('ROLE_SUPER_ADMIN')),
  )

  const features = ref([
    {
      icon: 'mdi-folder-multiple-outline',
      title: 'Folder Explorer',
      to: '/folder-explorer',
    },
    {
      icon: 'mdi-shield-lock-outline',
      title: 'Secure Uploads',
      to: '/secure-uploads',
    },
    {
      icon: 'mdi-clock-fast',
      title: 'Expiring Links',
      to: '/expiring-links',
    },
    {
      icon: 'mdi-lock-outline',
      title: 'Password Downloads',
      to: '/password-downloads',
    },
    {
      icon: 'mdi-history',
      title: 'Access Logs',
      to: '/access-logs',
    },
    {
      icon: 'mdi-account-group-outline',
      title: 'Collaborative Editing',
      to: '/collaborative-editing',
    },
    {
      icon: 'mdi-domain',
      title: 'Multi-Tenant Sharing',
      to: '/multi-tenant-sharing',
    },
    {
      icon: 'mdi-email-fast-outline',
      title: 'Email Notifications',
      to: '/email-notifications',
    },
    {
      icon: 'mdi-qrcode',
      title: 'QR Code Generation',
      to: '/qr-code-generation',
    },
  ])
</script>
