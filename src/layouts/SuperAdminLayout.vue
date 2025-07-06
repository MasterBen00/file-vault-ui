<template>
  <v-app>
    <v-navigation-drawer app permanent>
      <v-list-item subtitle="Management Console" title="Super Admin Panel" />
      <v-divider />
      <v-list dense nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          link
          :to="item.to"
        >
          <template #prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import AppFooter from '@/components/AppFooter.vue' // Assuming you have a global AppFooter

  const navItems = ref([
    { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/superadmin/dashboard' },
    { title: 'User Management', icon: 'mdi-account-group', to: '/superadmin/users' },
    { title: 'Role Management', icon: 'mdi-shield-account', to: '/superadmin/roles' },
    { title: 'Organization Management', icon: 'mdi-domain', to: '/superadmin/organizations' },
    { title: 'System Settings', icon: 'mdi-cog', to: '/superadmin/settings' },
    { title: 'Audit Logs', icon: 'mdi-history', to: '/superadmin/audit-logs' },
  ])
</script>

<style scoped>
/* Add any specific styles for the layout here */
</style>
