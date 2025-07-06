<template>
  <v-container class="pa-0" fluid>
    <!-- Welcome Banner (only shows for non-authenticated users or first-time visitors) -->
    <v-slide-y-transition>
      <v-sheet
        v-if="!authStore.isAuthenticated"
        class="welcome-banner d-flex align-center"
        color="primary"
        dark
      >
        <v-container>
          <v-row align="center">
            <v-col cols="12" md="7">
              <h1 class="text-h3 font-weight-bold mb-2">Welcome to FileSharer</h1>
              <h2 class="text-h6 font-weight-light mb-6">
                Your secure cloud storage solution with powerful sharing features
              </h2>
              <div class="d-flex flex-wrap gap-3">
                <v-btn
                  class="text-primary"
                  color="white"
                  rounded="pill"
                  size="large"
                  to="/register"
                  variant="elevated"
                >
                  Get Started
                </v-btn>
                <v-btn
                  color="secondary"
                  rounded="pill"
                  size="large"
                  to="/login"
                  variant="tonal"
                >
                  Sign In
                </v-btn>
              </div>
            </v-col>
            <v-col class="d-none d-md-flex justify-center" cols="12" md="5">
              <v-img
                alt="File Sharing Hero Image"
                class="hero-image"
                height="240"
                src="@/assets/logo.svg"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
    </v-slide-y-transition>

    <!-- Main Content Area -->
    <v-container class="pt-4 px-md-6 px-3" fluid>
      <!-- Simple Title Section (without duplicate buttons) -->
      <template v-if="authStore.isAuthenticated">
        <v-row class="mb-2">
          <v-col cols="12">
            <div class="d-flex align-center">
              <h1 class="text-h4 font-weight-medium">My Files</h1>
              <v-chip
                class="ml-4"
                color="primary"
                size="small"
                variant="flat"
              >
                <v-icon size="small" start>mdi-home</v-icon>
                Home Directory
              </v-chip>
            </div>
          </v-col>
        </v-row>

        <!-- Folder Explorer Integration with Ref - ONLY RENDERED FOR AUTHENTICATED USERS -->
        <FolderExplorer ref="folderExplorerRef" />
      </template>

      <!-- Feature Cards (Only shows for non-authenticated users) -->
      <v-row v-if="!authStore.isAuthenticated" class="mt-16">
        <v-col cols="12">
          <h2 class="text-h4 font-weight-bold text-center mb-8">
            Powerful File Sharing Features
          </h2>
        </v-col>

        <v-col
          v-for="feature in highlightedFeatures"
          :key="feature.title"
          cols="12"
          lg="3"
          sm="6"
        >
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              class="mx-auto feature-card h-100 d-flex flex-column"
              :class="{ 'on-hover': isHovering }"
              :elevation="isHovering ? 4 : 0"
              rounded="xl"
              :to="feature.to"
              variant="outlined"
            >
              <div class="feature-icon-wrapper">
                <v-avatar
                  class="feature-icon"
                  :color="feature.color + '-lighten-5'"
                  rounded="xl"
                  size="72"
                >
                  <v-icon :color="feature.color" :icon="feature.icon" size="36" />
                </v-avatar>
              </div>

              <v-card-item>
                <v-card-title class="text-h6 font-weight-bold">{{ feature.title }}</v-card-title>
              </v-card-item>

              <v-card-text class="text-body-1">
                {{ feature.description }}
              </v-card-text>

              <v-card-actions class="mt-auto">
                <v-spacer />
                <v-btn
                  :color="feature.color"
                  rounded="pill"
                  :to="feature.to"
                  variant="text"
                >
                  Explore
                  <v-icon class="ml-2" icon="mdi-arrow-right" />
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>

      <!-- Extra Features Section (only for non-authenticated users) -->
      <template v-if="!authStore.isAuthenticated">
        <v-row class="mt-16 mb-8">
          <v-col class="text-center" cols="12">
            <h2 class="text-h4 font-weight-bold mb-2">Why Choose FileSharer?</h2>
            <p class="text-subtitle-1 text-medium-emphasis mx-auto" style="max-width: 600px">
              Enjoy a modern, secure file sharing experience with our comprehensive suite of features
            </p>
          </v-col>
        </v-row>

        <v-row class="pb-12">
          <v-col
            v-for="(benefit, index) in benefits"
            :key="index"
            class="mb-6"
            cols="12"
            md="4"
          >
            <div class="d-flex align-start">
              <v-avatar
                class="mr-4 mt-1"
                :color="benefit.color"
                rounded
                size="48"
              >
                <v-icon
                  color="white"
                  :icon="benefit.icon"
                  size="24"
                />
              </v-avatar>
              <div>
                <h3 class="text-h6 font-weight-medium mb-2">{{ benefit.title }}</h3>
                <p class="text-body-2 text-medium-emphasis">{{ benefit.description }}</p>
              </div>
            </div>
          </v-col>
        </v-row>
      </template>
    </v-container>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import FolderExplorer from '@/pages/folder-explorer.vue'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const folderExplorerRef = ref(null)

  // Upload and folder creation dialogs handled via refs
  function openUploadDialog () {
    if (folderExplorerRef.value) {
      folderExplorerRef.value.openUploadDialog()
    }
  }

  function openCreateFolderDialog () {
    if (folderExplorerRef.value) {
      folderExplorerRef.value.openCreateFolderDialog()
    }
  }

  // Only show a subset of features for marketing purposes on the landing page
  const highlightedFeatures = ref([
    {
      icon: 'mdi-shield-lock-outline',
      title: 'Secure File Sharing',
      description: 'End-to-end encryption ensures your sensitive files remain private and secure.',
      to: '/secure-uploads',
      color: 'primary',
    },
    {
      icon: 'mdi-clock-fast',
      title: 'Expiring Links',
      description: 'Set time limits on your shared links for temporary access control.',
      to: '/expiring-links',
      color: 'deep-purple',
    },
    {
      icon: 'mdi-lock-outline',
      title: 'Password Protection',
      description: 'Add an extra layer of security with password-protected downloads.',
      to: '/password-downloads',
      color: 'amber-darken-2',
    },
    {
      icon: 'mdi-account-group-outline',
      title: 'Team Collaboration',
      description: 'Work together in real-time with collaborative document editing.',
      to: '/collaborative-editing',
      color: 'green',
    },
  ])

  // Additional benefits for marketing section
  const benefits = ref([
    {
      icon: 'mdi-shield-check',
      title: 'Enterprise-Grade Security',
      description: 'Our platform implements advanced encryption and security measures to keep your files safe.',
      color: 'indigo',
    },
    {
      icon: 'mdi-speedometer',
      title: 'Lightning Fast Performance',
      description: 'Upload and download files with blazing speed, even for large file transfers.',
      color: 'deep-orange',
    },
    {
      icon: 'mdi-devices',
      title: 'Access From Any Device',
      description: 'Use FileSharer seamlessly across all your devices with our responsive design.',
      color: 'teal',
    },
    {
      icon: 'mdi-account-multiple-plus',
      title: 'Team Management',
      description: 'Control access permissions and organize team members with powerful admin tools.',
      color: 'blue',
    },
    {
      icon: 'mdi-chart-bar',
      title: 'Detailed Analytics',
      description: 'Track file access, downloads, and activity with comprehensive reports.',
      color: 'purple',
    },
    {
      icon: 'mdi-check-decagram',
      title: 'Compliance Ready',
      description: 'Meet regulatory requirements with our compliant file sharing platform.',
      color: 'green-darken-1',
    },
  ])
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, var(--v-theme-primary) 0%, #1565C0 100%);
  padding: 3.5rem 0;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 32px 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.welcome-banner::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  pointer-events: none;
}

.hero-image {
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2));
  transform: scale(1.1);
  transition: transform 0.5s ease;
}

.hero-image:hover {
  transform: scale(1.15);
}

.feature-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.feature-card.on-hover {
  transform: translateY(-8px);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.feature-icon-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 28px;
}

.feature-icon {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.on-hover .feature-icon {
  transform: scale(1.05);
}
</style>
