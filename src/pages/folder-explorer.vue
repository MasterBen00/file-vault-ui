<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-row>
      <v-col class="py-2" cols="12">
        <div class="d-flex flex-wrap align-center justify-space-between gap-3">
          <h1 class="text-h4">Folder Explorer</h1>

          <div class="d-flex align-center flex-grow-1 mx-4" style="max-width: 500px">
            <!-- Search Bar - Moved to be more visible -->
            <v-text-field
              v-model="searchQuery"
              class="search-field"
              density="compact"
              hide-details
              placeholder="Search in current folder"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @input="filterItems"
            />
          </div>

          <!-- View Toggle -->
          <v-btn-toggle v-model="viewMode" density="comfortable" mandatory rounded="pill">
            <v-btn :ripple="false" value="grid" variant="text">
              <v-icon>mdi-view-grid-outline</v-icon>
            </v-btn>
            <v-btn :ripple="false" value="list" variant="text">
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-col>
    </v-row>

    <!-- Breadcrumbs & Actions Bar -->
    <v-row>
      <v-col class="py-1" cols="12">
        <v-card class="px-4 py-2" flat rounded="lg">
          <div class="d-flex justify-space-between align-center">
            <!-- Breadcrumb Navigation -->
            <div class="d-flex align-center">
              <v-btn
                class="mr-1"
                :disabled="!currentFolderId"
                icon="mdi-arrow-left"
                variant="text"
                @click="navigateBack"
              />

              <v-breadcrumbs
                class="pa-0"
                divider="/"
                :items="breadcrumbItems"
              >
                <template #prepend>
                  <v-icon
                    class="cursor-pointer"
                    icon="mdi-folder-home-outline"
                    size="small"
                    @click="navigateToRoot"
                  />
                </template>
                <template #item="{ item }">
                  <v-breadcrumbs-item
                    class="cursor-pointer"
                    :disabled="item.disabled"
                  >
                    <span @click="navigateToFolder(item.value)">{{ item.title }}</span>
                  </v-breadcrumbs-item>
                </template>
              </v-breadcrumbs>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex">
              <v-btn
                class="mr-2"
                color="primary"
                :disabled="!currentFolderId && !isRootFolder"
                prepend-icon="mdi-upload"
                @click="openUploadDialog"
              >
                Upload File
              </v-btn>
              <v-btn
                color="success"
                prepend-icon="mdi-folder-plus"
                @click="openCreateFolderDialog"
              >
                New Folder
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Explorer Section -->
    <v-row>
      <v-col cols="12">
        <div v-if="isLoading" class="explorer-loading">
          <v-skeleton-loader v-for="n in viewMode === 'grid' ? 8 : 5" :key="n" class="ma-2" :type="viewMode === 'grid' ? 'card' : 'list-item-three-line'" />
        </div>

        <v-alert v-else-if="error" class="mt-2" type="error">{{ error }}</v-alert>

        <div v-else>
          <!-- No Items Message -->
          <div v-if="filteredContents.folders.length === 0 && filteredContents.files.length === 0" class="empty-state mt-8">
            <div class="text-center">
              <v-icon color="grey-lighten-1" icon="mdi-folder-open-outline" size="64" />
              <h3 class="text-h6 mt-4 text-grey-darken-1">This folder is empty</h3>
              <p class="text-body-2 mt-1 text-medium-emphasis">
                Upload files or create folders to organize your content
              </p>
              <div class="mt-4">
                <v-btn
                  class="mr-2"
                  color="primary"
                  :disabled="!currentFolderId && !isRootFolder"
                  prepend-icon="mdi-upload"
                  @click="openUploadDialog"
                >
                  Upload File
                </v-btn>
                <v-btn
                  color="success"
                  prepend-icon="mdi-folder-plus"
                  @click="openCreateFolderDialog"
                >
                  New Folder
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Grid View -->
          <div v-else-if="viewMode === 'grid'">
            <v-row>
              <v-col
                v-for="folder in filteredContents.folders"
                :key="folder.id"
                cols="12"
                lg="3"
                md="4"
                sm="6"
                xl="2"
              >
                <v-hover v-slot="{ isHovering, props }">
                  <v-card
                    v-bind="props"
                    class="grid-item folder-card rounded-lg"
                    :elevation="isHovering ? 3 : 1"
                    @click="navigateToFolder(folder.id)"
                  >
                    <div class="pa-4 d-flex flex-column align-center justify-center">
                      <div class="folder-icon-container mb-3">
                        <v-icon color="amber-darken-2" icon="mdi-folder" size="42" />
                      </div>
                      <div class="text-center truncate-text">
                        <span class="text-subtitle-1 font-weight-medium">{{ folder.name }}</span>
                      </div>
                    </div>
                    <v-divider />
                    <v-card-actions class="pa-2">
                      <v-spacer />
                      <div class="action-buttons" :class="{ 'show-actions': isHovering }">
                        <v-tooltip location="bottom" text="Rename">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              icon
                              size="small"
                              variant="text"
                              @click.stop="openRenameFolderDialog(folder)"
                            >
                              <v-icon size="18">mdi-pencil</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip location="bottom" text="Delete">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              color="error"
                              icon
                              size="small"
                              variant="text"
                              @click.stop="openDeleteFolderDialog(folder)"
                            >
                              <v-icon size="18">mdi-delete</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </v-card-actions>
                  </v-card>
                </v-hover>
              </v-col>

              <v-col
                v-for="file in filteredContents.files"
                :key="file.id"
                cols="12"
                lg="3"
                md="4"
                sm="6"
                xl="2"
              >
                <v-hover v-slot="{ isHovering, props }">
                  <v-card
                    v-bind="props"
                    class="grid-item file-card rounded-lg"
                    :elevation="isHovering ? 3 : 1"
                  >
                    <div class="pa-4 d-flex flex-column align-center justify-center">
                      <div class="file-icon-container mb-3">
                        <v-icon :color="getFileColor(file.mimeType)" :icon="getFileIcon(file.mimeType)" size="42" />
                      </div>
                      <div class="text-center truncate-text">
                        <span class="text-subtitle-1 font-weight-medium">{{ file.originalFileName }}</span>
                      </div>
                      <div class="text-caption text-grey mt-1">
                        {{ formatFileSize(file.fileSize) }}
                      </div>
                      <v-chip
                        class="mt-2"
                        :color="file.passwordProtected ? 'warning' : 'success'"
                        size="x-small"
                        :variant="file.passwordProtected ? 'elevated' : 'flat'"
                      >
                        {{ file.passwordProtected ? 'Password Protected' : 'Open Access' }}
                      </v-chip>
                    </div>
                    <v-divider />
                    <v-card-actions class="pa-2">
                      <v-tooltip location="bottom" text="Download">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            color="primary"
                            icon
                            size="small"
                            variant="text"
                            @click.stop="handleDownload(file)"
                          >
                            <v-icon size="18">mdi-download</v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                      <v-spacer />
                      <div class="action-buttons" :class="{ 'show-actions': isHovering }">
                        <v-tooltip location="bottom" text="Share">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              color="success"
                              icon
                              size="small"
                              variant="text"
                              @click.stop="openShareDialog(file)"
                            >
                              <v-icon size="18">mdi-share-variant</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip location="bottom" text="Delete">
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              color="error"
                              icon
                              size="small"
                              variant="text"
                              @click.stop="confirmDeleteFile(file)"
                            >
                              <v-icon size="18">mdi-delete</v-icon>
                            </v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </v-card-actions>
                  </v-card>
                </v-hover>
              </v-col>
            </v-row>
          </div>

          <!-- List View -->
          <div v-else class="list-view-container">
            <v-card class="list-header pa-2 d-flex align-center rounded-t-lg" flat variant="tonal">
              <div class="d-flex align-center" style="width: 50%">
                <div class="text-center" style="width: 56px">Type</div>
                <div>Name</div>
              </div>
              <div class="d-flex justify-space-between align-center" style="width: 50%">
                <div>Size</div>
                <div>Last Modified</div>
                <div class="text-center" style="width: 120px">Actions</div>
              </div>
            </v-card>

            <!-- Folders List -->
            <v-list v-if="filteredContents.folders.length > 0" class="list-items pa-0 rounded-0">
              <v-hover v-for="folder in filteredContents.folders" :key="folder.id" v-slot="{ isHovering, props }">
                <v-list-item
                  v-bind="props"
                  :class="{ 'list-item-hover': isHovering }"
                  @click="navigateToFolder(folder.id)"
                >
                  <template #prepend>
                    <v-avatar class="mr-3" color="amber-lighten-5" rounded>
                      <v-icon color="amber-darken-2" icon="mdi-folder" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-subtitle-1 font-weight-medium">{{ folder.name }}</v-list-item-title>
                  <template #append>
                    <div class="d-flex align-center justify-space-between list-details-container">
                      <span class="text-caption text-grey px-3">—</span>
                      <span class="text-caption text-grey px-3">{{ new Date(folder.createdAt).toLocaleDateString() }}</span>
                      <div class="action-buttons-container">
                        <v-btn
                          icon
                          size="small"
                          variant="text"
                          @click.stop="openRenameFolderDialog(folder)"
                        >
                          <v-icon size="18">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          color="error"
                          icon
                          size="small"
                          variant="text"
                          @click.stop="openDeleteFolderDialog(folder)"
                        >
                          <v-icon size="18">mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider />
              </v-hover>
            </v-list>

            <!-- Files List -->
            <v-list v-if="filteredContents.files.length > 0" class="list-items pa-0" :class="{ 'rounded-b-lg': true, 'rounded-t-lg': filteredContents.folders.length === 0 }">
              <v-hover v-for="file in filteredContents.files" :key="file.id" v-slot="{ isHovering, props }">
                <v-list-item
                  v-bind="props"
                  :class="{ 'list-item-hover': isHovering }"
                >
                  <template #prepend>
                    <v-avatar class="mr-3" :color="`${getFileColor(file.mimeType)}-lighten-5`" rounded>
                      <v-icon :color="getFileColor(file.mimeType)" :icon="getFileIcon(file.mimeType)" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-subtitle-1 font-weight-medium d-flex align-center">
                    {{ file.originalFileName }}
                    <v-chip
                      v-if="file.passwordProtected"
                      class="ml-2"
                      color="warning"
                      size="x-small"
                      variant="flat"
                    >
                      <v-icon size="14" start>mdi-lock</v-icon>
                      Protected
                    </v-chip>
                  </v-list-item-title>
                  <template #append>
                    <div class="d-flex align-center justify-space-between list-details-container">
                      <span class="text-caption text-grey px-3">{{ formatFileSize(file.fileSize) }}</span>
                      <span class="text-caption text-grey px-3">{{ new Date(file.uploadTime).toLocaleDateString() }}</span>
                      <div class="action-buttons-container">
                        <v-btn
                          color="primary"
                          icon
                          size="small"
                          variant="text"
                          @click.stop="handleDownload(file)"
                        >
                          <v-icon size="18">mdi-download</v-icon>
                        </v-btn>
                        <v-btn
                          color="success"
                          icon
                          size="small"
                          variant="text"
                          @click.stop="openShareDialog(file)"
                        >
                          <v-icon size="18">mdi-share-variant</v-icon>
                        </v-btn>
                        <v-btn
                          color="error"
                          icon
                          size="small"
                          variant="text"
                          @click.stop="confirmDeleteFile(file)"
                        >
                          <v-icon size="18">mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="filteredContents.files.indexOf(file) !== filteredContents.files.length - 1" />
              </v-hover>
            </v-list>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Upload File Dialog -->
    <v-dialog v-model="uploadDialog" max-width="600">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-upload</v-icon>
          Upload File to {{ currentFolderName || 'Root' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleFileUpload">
            <v-file-input
              v-model="selectedFile"
              accept="*/*"
              class="mb-2"
              label="Select file"
              prepend-icon="mdi-paperclip"
              :rules="[v => !!v || 'Please select a file to upload']"
              show-size
              variant="outlined"
              @update:model-value="onFileSelected"
            />

            <v-text-field
              v-model.number="maxDownloads"
              class="mt-4"
              density="comfortable"
              label="Maximum Downloads"
              min="1"
              type="number"
              variant="outlined"
            />

            <v-checkbox
              v-model="enableExpiry"
              class="mt-4"
              color="primary"
              label="Set expiry time"
            />

            <v-text-field
              v-if="enableExpiry"
              v-model.number="expiryMinutes"
              class="mt-2"
              density="comfortable"
              hint="If not provided, file will never expire"
              label="Expiry Minutes (leave empty for no expiry)"
              min="1"
              persistent-hint
              type="number"
              variant="outlined"
            />

            <v-text-field
              v-model="password"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              class="mt-4"
              density="comfortable"
              label="Password (Optional)"
              prepend-inner-icon="mdi-lock-outline"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showPassword = !showPassword"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn
            color="primary"
            :disabled="!selectedFile || isUploading"
            :loading="isUploading"
            variant="elevated"
            @click="handleFileUpload"
          >
            Upload File
          </v-btn>
          <v-btn color="secondary" variant="text" @click="uploadDialog = false">Cancel</v-btn>
        </v-card-actions>
        <v-alert
          v-if="uploadMessage"
          class="mx-4 mb-4"
          density="compact"
          :type="uploadMessageType"
        >
          {{ uploadMessage }}
        </v-alert>
      </v-card>
    </v-dialog>

    <!-- Create Folder Dialog -->
    <v-dialog v-model="createFolderDialog" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title>
          <v-icon class="mr-2" color="success">mdi-folder-plus</v-icon>
          Create New Folder
        </v-card-title>
        <v-card-text>
          <v-form ref="createFolderForm">
            <v-text-field
              v-model="newFolderName"
              autofocus
              density="comfortable"
              label="Folder Name"
              :rules="folderNameRules"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn
            color="success"
            :disabled="!newFolderName"
            :loading="isCreatingFolder"
            variant="elevated"
            @click="createFolder"
          >
            Create Folder
          </v-btn>
          <v-btn color="secondary" variant="text" @click="createFolderDialog = false">Cancel</v-btn>
        </v-card-actions>
        <v-card-text v-if="createFolderError">
          <v-alert class="mt-2" type="error">
            {{ createFolderError }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Rename Folder Dialog -->
    <v-dialog v-model="renameFolderDialog" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title>
          <v-icon class="mr-2">mdi-pencil</v-icon>
          Rename Folder
        </v-card-title>
        <v-card-text>
          <v-form ref="renameFolderForm">
            <v-text-field
              v-model="updatedFolderName"
              autofocus
              density="comfortable"
              label="New Folder Name"
              :rules="folderNameRules"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn
            color="primary"
            :disabled="!updatedFolderName"
            :loading="isRenamingFolder"
            variant="elevated"
            @click="renameFolder"
          >
            Rename Folder
          </v-btn>
          <v-btn color="secondary" variant="text" @click="renameFolderDialog = false">Cancel</v-btn>
        </v-card-actions>
        <v-card-text v-if="renameFolderError">
          <v-alert class="mt-2" type="error">
            {{ renameFolderError }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Folder Confirmation Dialog -->
    <v-dialog v-model="deleteFolderDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          Confirm Delete Folder
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete the folder <strong>{{ folderToDelete?.name }}</strong>?</p>
          <p class="text-caption text-red">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteFolderDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeletingFolder"
            variant="elevated"
            @click="executeFolderDelete"
          >
            Delete Folder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Password Protected Download Dialog -->
    <v-dialog v-model="downloadDialog" max-width="400" persistent>
      <v-card class="rounded-lg">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="warning">mdi-lock</v-icon>
          Password Required
        </v-card-title>
        <v-card-text>
          <p class="mb-4">This file is protected. Please enter the password to download.</p>
          <v-text-field
            v-model="downloadPassword"
            autofocus
            density="comfortable"
            label="Enter Password"
            type="password"
            variant="outlined"
            @keyup.enter="confirmPasswordDownload"
          />
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="confirmPasswordDownload">Download</v-btn>
          <v-btn color="secondary" variant="text" @click="downloadDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share File Dialog -->
    <v-dialog v-model="shareDialog" max-width="600">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="success">mdi-share-variant</v-icon>
          Share File
        </v-card-title>
        <v-card-text>
          <p class="mb-2">Sharing: <strong>{{ fileToShare?.originalFileName || '' }}</strong></p>
          <v-combobox
            v-model="emailsToShare"
            chips
            closable-chips
            hint="Press Enter after each email address"
            label="Enter email addresses"
            multiple
            persistent-hint
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn
            color="success"
            :disabled="isSharing || emailsToShare.length === 0"
            :loading="isSharing"
            variant="elevated"
            @click="shareFileWithUsers"
          >
            Share
          </v-btn>
          <v-btn color="secondary" variant="text" @click="closeShareDialog">Cancel</v-btn>
        </v-card-actions>
        <v-card-text v-if="shareResult">
          <v-alert v-if="shareResult.shared?.length" class="mb-2" type="success">
            Shared with: {{ shareResult.shared.join(', ') }}
          </v-alert>
          <v-alert v-if="shareResult.alreadyShared?.length" class="mb-2" type="info">
            Already shared with: {{ shareResult.alreadyShared.join(', ') }}
          </v-alert>
          <v-alert v-if="shareResult.notFound?.length" class="mb-2" type="error">
            Not found: {{ shareResult.notFound.join(', ') }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete File Confirmation Dialog -->
    <v-dialog v-model="deleteFileDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ fileToDelete?.originalFileName }}</strong>?</p>
          <p class="text-caption text-red">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteFileDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleteFileLoading"
            variant="elevated"
            @click="executeFileDelete"
          >
            Delete File
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, defineExpose, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import fileService, { type FileMetaResponseDto } from '@/services/fileService'
  import folderService, { type FolderContentsDto, type FolderDto } from '@/services/folderService'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  // Folder navigation state
  const folderContents = ref<FolderContentsDto>({ folders: [], files: [] })
  const filteredContents = ref<FolderContentsDto>({ folders: [], files: [] })
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const currentFolderId = ref<string | null>(null)
  const prevFolderId = ref<string | null>(null)
  const folderPath = ref<FolderDto[]>([])
  const isRootFolder = ref(true)
  const searchQuery = ref('')

  // View mode (list or grid)
  const viewMode = ref<'list' | 'grid'>(
    localStorage.getItem('folderExplorerViewMode') as 'list' | 'grid' || 'grid',
  )

  // File upload state
  const uploadDialog = ref(false)
  const selectedFile = ref<File | null>(null)
  const maxDownloads = ref<number>(10)
  const enableExpiry = ref<boolean>(false)
  const expiryMinutes = ref<number>(1440) // Default to 24 hours
  const password = ref<string>('')
  const showPassword = ref<boolean>(false)
  const isUploading = ref<boolean>(false)
  const uploadMessage = ref<string | null>(null)
  const uploadMessageType = ref<'success' | 'error'>('success')

  // Folder create/edit state
  const createFolderDialog = ref(false)
  const renameFolderDialog = ref(false)
  const deleteFolderDialog = ref(false)
  const newFolderName = ref('')
  const updatedFolderName = ref('')
  const folderToDelete = ref<FolderDto | null>(null)
  const folderToRename = ref<FolderDto | null>(null)
  const isCreatingFolder = ref(false)
  const isRenamingFolder = ref(false)
  const isDeletingFolder = ref(false)
  const createFolderError = ref<string | null>(null)
  const renameFolderError = ref<string | null>(null)

  // File action state
  const downloadDialog = ref<boolean>(false)
  const downloadPassword = ref<string>('')
  const downloadFileRef = ref<FileMetaResponseDto | null>(null)
  const fileToShare = ref<FileMetaResponseDto | null>(null)
  const shareDialog = ref<boolean>(false)
  const emailsToShare = ref<string[]>([])
  const isSharing = ref<boolean>(false)
  const shareResult = ref<{ shared?: string[], alreadyShared?: string[], notFound?: string[] } | null>(null)
  const deleteFileDialog = ref(false)
  const fileToDelete = ref<FileMetaResponseDto | null>(null)
  const isDeleteFileLoading = ref(false)

  const folderNameRules = [
    (v: string) => !!v || 'Folder name is required',
    (v: string) => (v && v.length <= 50) || 'Folder name must be less than 50 characters',
  ]

  // Computed properties
  const currentFolderName = computed(() => {
    if (!currentFolderId.value) return 'Root'
    const currentFolder = folderPath.value.at(-1)
    return currentFolder ? currentFolder.name : 'Unknown Folder'
  })

  const breadcrumbItems = computed(() => {
    // If we're in the root folder, return just the root item
    if (isRootFolder.value) {
      return [{
        title: 'Root',
        value: null,
        disabled: true,
      }]
    }

    // Create an array starting with the root item
    const items = [{
      title: 'Root',
      value: null,
      disabled: false,
    }]

    // Add each folder in the path
    if (folderPath.value && folderPath.value.length > 0) {
      for (const folder of folderPath.value) {
        items.push({
          title: folder.name,
          value: folder.id,
          disabled: folder.id === currentFolderId.value, // Disable the current folder
        })
      }
    }

    return items
  })

  // Watch for search query changes and filter content
  watch(searchQuery, () => {
    filterItems()
  })

  // Watch for folder content changes to update filtered content
  watch(folderContents, () => {
    filterItems()
  }, { deep: true })

  // Watch for view mode changes and save to localStorage
  watch(viewMode, newMode => {
    localStorage.setItem('folderExplorerViewMode', newMode)
  })

  // Load initial data and listen for route changes
  onMounted(async () => {
    // Get the folder ID from the URL if it exists
    if (route.query.folderId) {
      currentFolderId.value = route.query.folderId as string
      isRootFolder.value = false
    }

    // Load the initial folder contents
    await loadFolderContents()
  })

  // Functions for folder navigation
  async function loadFolderContents () {
    isLoading.value = true
    error.value = null

    try {
      if (currentFolderId.value) {
        folderContents.value = await folderService.getFolderContents(currentFolderId.value)
        // Load folder path for breadcrumb navigation
        folderPath.value = await folderService.getFolderPath(currentFolderId.value)
        isRootFolder.value = false
      } else {
        folderContents.value = await folderService.getRootFolderContents()
        folderPath.value = []
        isRootFolder.value = true
      }
      filterItems()
    } catch (error_: any) {
      console.error('Error loading folder contents:', error_)
      error.value = error_.message || 'Failed to load folder contents'
    } finally {
      isLoading.value = false
    }
  }

  function filterItems () {
    if (!searchQuery.value) {
      filteredContents.value = { ...folderContents.value }
      return
    }

    const query = searchQuery.value.toLowerCase()

    filteredContents.value = {
      folders: folderContents.value.folders.filter(folder =>
        folder.name.toLowerCase().includes(query)),
      files: folderContents.value.files.filter(file =>
        file.originalFileName.toLowerCase().includes(query)),
    }
  }

  function navigateToFolder (folderId: string) {
    prevFolderId.value = currentFolderId.value
    currentFolderId.value = folderId
    isRootFolder.value = false
    searchQuery.value = ''

    // Update the URL without page reload
    router.push({
      path: '/folder-explorer',
      query: { folderId },
    })

    loadFolderContents()
  }

  function navigateBack () {
    if (folderPath.value.length > 1) {
      // Go to parent folder
      const parentFolder = folderPath.value.at(-2)
      navigateToFolder(parentFolder.id)
    } else {
      // Go to root
      navigateToRoot()
    }
  }

  function navigateToRoot () {
    prevFolderId.value = currentFolderId.value
    currentFolderId.value = null
    isRootFolder.value = true
    searchQuery.value = ''

    // Remove the folderId from the URL
    router.push({
      path: '/folder-explorer',
      query: {},
    })

    loadFolderContents()
  }

  // Functions for folder management
  function openCreateFolderDialog () {
    newFolderName.value = ''
    createFolderError.value = null
    createFolderDialog.value = true
  }

  async function createFolder () {
    if (!newFolderName.value) return

    isCreatingFolder.value = true
    createFolderError.value = null

    try {
      await folderService.createFolder(newFolderName.value, currentFolderId.value || undefined)
      createFolderDialog.value = false
      // Reload folder contents
      await loadFolderContents()
    } catch (error_: any) {
      console.error('Error creating folder:', error_)
      createFolderError.value = error_.message || 'Failed to create folder'
    } finally {
      isCreatingFolder.value = false
    }
  }

  function openRenameFolderDialog (folder: FolderDto) {
    folderToRename.value = folder
    updatedFolderName.value = folder.name
    renameFolderError.value = null
    renameFolderDialog.value = true
  }

  async function renameFolder () {
    if (!folderToRename.value || !updatedFolderName.value) return

    isRenamingFolder.value = true
    renameFolderError.value = null

    try {
      await folderService.updateFolder(folderToRename.value.id, updatedFolderName.value)
      renameFolderDialog.value = false
      // Reload folder contents
      await loadFolderContents()
    } catch (error_: any) {
      console.error('Error renaming folder:', error_)
      renameFolderError.value = error_.message || 'Failed to rename folder'
    } finally {
      isRenamingFolder.value = false
    }
  }

  function openDeleteFolderDialog (folder: FolderDto) {
    folderToDelete.value = folder
    deleteFolderDialog.value = true
  }

  async function executeFolderDelete () {
    if (!folderToDelete.value) return

    isDeletingFolder.value = true

    try {
      await folderService.deleteFolder(folderToDelete.value.id)
      deleteFolderDialog.value = false
      // Reload folder contents
      await loadFolderContents()
    } catch (error_: any) {
      console.error('Error deleting folder:', error_)
    // Show error alert - you could add an error state for delete
    } finally {
      isDeletingFolder.value = false
    }
  }

  // Functions for file upload
  function openUploadDialog () {
    selectedFile.value = null
    maxDownloads.value = 10
    enableExpiry.value = false
    expiryMinutes.value = 1440
    password.value = ''
    uploadMessage.value = null
    uploadDialog.value = true
  }

  function onFileSelected (file: File | null) {
    selectedFile.value = file
  }

  async function handleFileUpload () {
    if (!selectedFile.value) return

    isUploading.value = true
    uploadMessage.value = null

    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('maxDownloads', maxDownloads.value.toString())

      // Only include expiryMinutes if enableExpiry is true
      if (enableExpiry.value) {
        formData.append('expiryMinutes', expiryMinutes.value.toString())
      }

      // Only include password if provided
      if (password.value) {
        formData.append('password', password.value)
      }

      // Include folder ID if we're in a folder
      if (currentFolderId.value) {
        formData.append('folderId', currentFolderId.value)
      }

      await fileService.uploadFile(formData)

      uploadMessageType.value = 'success'
      uploadMessage.value = 'File uploaded successfully!'

      // Reset form and reload folder contents after successful upload
      setTimeout(() => {
        uploadDialog.value = false
        uploadMessage.value = null
        loadFolderContents()
      }, 1500)
    } catch (error_: any) {
      console.error('Error uploading file:', error_)
      uploadMessageType.value = 'error'
      uploadMessage.value = error_.message || 'Failed to upload file'
    } finally {
      isUploading.value = false
    }
  }

  // Functions for file management
  function confirmDeleteFile (file: FileMetaResponseDto) {
    fileToDelete.value = file
    deleteFileDialog.value = true
  }

  async function executeFileDelete () {
    if (!fileToDelete.value) return

    isDeleteFileLoading.value = true

    try {
      await fileService.deleteFile(fileToDelete.value.id)
      deleteFileDialog.value = false
      // Reload folder contents
      await loadFolderContents()
    } catch (error_: any) {
      console.error('Error deleting file:', error_)
    // Show error message
    } finally {
      isDeleteFileLoading.value = false
    }
  }

  function handleDownload (file: FileMetaResponseDto) {
    if (file.passwordProtected) {
      downloadFileRef.value = file
      downloadPassword.value = ''
      downloadDialog.value = true
    } else {
      initiateDownload(file.id)
    }
  }

  async function confirmPasswordDownload () {
    if (!downloadFileRef.value) return

    try {
      await initiateDownload(downloadFileRef.value.id, downloadPassword.value)
      downloadDialog.value = false
    } catch {
    // Error handling will be done in initiateDownload
    }
  }

  async function initiateDownload (fileId: string, password?: string) {
    try {
      // First, get the file metadata to ensure we have the correct filename
      let fileName = 'download'

      // If we have a downloadFileRef, use its originalFileName
      if (downloadFileRef.value && downloadFileRef.value.id === fileId) {
        fileName = downloadFileRef.value.originalFileName
      } else {
        // Try to find the file in the current folder contents
        const fileInfo = folderContents.value.files.find(f => f.id === fileId)
        if (fileInfo) {
          fileName = fileInfo.originalFileName
        }
      }

      // Get the file as a blob
      const fileBlob = await fileService.downloadFileById(fileId, password)

      // Create a URL for the blob
      const downloadUrl = URL.createObjectURL(fileBlob)

      // Create an anchor element and trigger the download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName // Set the filename for download

      // Append to document, click, and then remove
      document.body.append(link)
      link.click()
      link.remove()

      // Clean up the URL object after a delay
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
    } catch (error_: any) {
      console.error('Error downloading file:', error_)
      // Show error message
    }
  }

  function openShareDialog (file: FileMetaResponseDto) {
    fileToShare.value = file
    emailsToShare.value = []
    shareResult.value = null
    shareDialog.value = true
  }

  async function shareFileWithUsers () {
    if (!fileToShare.value || emailsToShare.value.length === 0) return

    isSharing.value = true

    try {
      shareResult.value = await fileService.shareFileWithUsers(fileToShare.value.id, emailsToShare.value)
    } catch (error_: any) {
      console.error('Error sharing file:', error_)
    // Handle error
    } finally {
      isSharing.value = false
    }
  }

  function closeShareDialog () {
    shareDialog.value = false
    shareResult.value = null
  }

  // Helper functions
  function formatFileSize (bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getFileIcon (mimeType?: string, fileName?: string): string {
    if (!mimeType && !fileName) return 'mdi-file-outline'

    // Check by mime type first
    if (mimeType) {
      // Images
      if (mimeType.startsWith('image/')) {
        if (mimeType.includes('svg')) return 'mdi-svg'
        return 'mdi-file-image-outline'
      }

      // Videos
      if (mimeType.startsWith('video/')) return 'mdi-file-video-outline'

      // Audio
      if (mimeType.startsWith('audio/')) return 'mdi-file-music-outline'

      // Text & code files
      if (mimeType.startsWith('text/')) {
        if (mimeType.includes('html')) return 'mdi-language-html5'
        if (mimeType.includes('css')) return 'mdi-language-css3'
        if (mimeType.includes('javascript')) return 'mdi-nodejs'
        if (mimeType.includes('json')) return 'mdi-code-json'
        if (mimeType.includes('markdown')) return 'mdi-language-markdown'
        if (mimeType.includes('xml')) return 'mdi-xml'
        return 'mdi-file-document-outline'
      }

      // Document formats
      if (mimeType.includes('pdf')) return 'mdi-file-pdf-box'
      if (mimeType.includes('word') || mimeType.includes('document')) return 'mdi-microsoft-word'
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'mdi-microsoft-excel'
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'mdi-microsoft-powerpoint'

      // Archives
      if (mimeType.includes('zip') || mimeType.includes('compressed')
        || mimeType.includes('tar') || mimeType.includes('gzip')) {
        return 'mdi-zip-box-outline'
      }
    }

    // If mime type didn't match or isn't available, check by file extension
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase()

      if (extension) {
        // Images
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(extension)) {
          return 'mdi-file-image-outline'
        }
        if (extension === 'svg') return 'mdi-svg'

        // Videos
        if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'mpeg'].includes(extension)) {
          return 'mdi-file-video-outline'
        }

        // Audio
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) {
          return 'mdi-file-music-outline'
        }

        // Documents
        if (extension === 'pdf') return 'mdi-file-pdf-box'
        if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) return 'mdi-microsoft-word'
        if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) return 'mdi-microsoft-excel'
        if (['ppt', 'pptx', 'odp', 'key'].includes(extension)) return 'mdi-microsoft-powerpoint'
        if (['txt', 'md', 'rtf'].includes(extension)) return 'mdi-file-document-outline'

        // Code files
        if (['html', 'htm'].includes(extension)) return 'mdi-language-html5'
        if (['css', 'scss', 'sass', 'less'].includes(extension)) return 'mdi-language-css3'
        if (['js', 'ts', 'jsx', 'tsx'].includes(extension)) return 'mdi-nodejs'
        if (extension === 'json') return 'mdi-code-json'
        if (['xml', 'svg'].includes(extension)) return 'mdi-xml'
        if (['php', 'py', 'java', 'c', 'cpp', 'cs', 'rb'].includes(extension)) return 'mdi-code-tags'

        // Archives
        if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(extension)) {
          return 'mdi-zip-box-outline'
        }

        // Other specific file types
        if (extension === 'exe') return 'mdi-application'
        if (extension === 'iso') return 'mdi-disc'
        if (extension === 'apk') return 'mdi-android'
        if (extension === 'ipa') return 'mdi-apple'
      }
    }

    // Default icon if no matches
    return 'mdi-file-outline'
  }

  function getFileColor (mimeType?: string, fileName?: string): string {
    if (!mimeType && !fileName) return 'grey'

    // Helper function to get extension from filename
    const getExtension = (name: string): string | undefined => {
      return name.split('.').pop()?.toLowerCase()
    }

    let fileType = 'unknown'

    // Try to determine file type from mime type first
    if (mimeType) {
      if (mimeType.startsWith('image/')) fileType = 'image'
      else if (mimeType.startsWith('video/')) fileType = 'video'
      else if (mimeType.startsWith('audio/')) fileType = 'audio'
      else if (mimeType.startsWith('text/')) fileType = 'text'
      else if (mimeType.includes('pdf')) fileType = 'pdf'
      else if (mimeType.includes('word') || mimeType.includes('document')) fileType = 'word'
      else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) fileType = 'excel'
      else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) fileType = 'powerpoint'
      else if (mimeType.includes('zip') || mimeType.includes('compressed')) fileType = 'archive'
    }

    // If file type still unknown and filename is available, try by extension
    if (fileType === 'unknown' && fileName) {
      const extension = getExtension(fileName)
      if (extension) {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff'].includes(extension)) {
          fileType = 'image'
        } else if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(extension)) {
          fileType = 'video'
        } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension)) {
          fileType = 'audio'
        } else if (['txt', 'md', 'rtf', 'html', 'css', 'js'].includes(extension)) {
          fileType = 'text'
        } else if (extension === 'pdf') {
          fileType = 'pdf'
        } else if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
          fileType = 'word'
        } else if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
          fileType = 'excel'
        } else if (['ppt', 'pptx', 'odp'].includes(extension)) {
          fileType = 'powerpoint'
        } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
          fileType = 'archive'
        } else if (['exe', 'apk', 'msi', 'dmg'].includes(extension)) {
          fileType = 'executable'
        } else if (['php', 'py', 'java', 'c', 'cpp', 'cs', 'go'].includes(extension)) {
          fileType = 'code'
        }
      }
    }

    // Map file types to colors
    switch (fileType) {
      case 'image': { return 'cyan'
      }
      case 'video': { return 'purple'
      }
      case 'audio': { return 'indigo'
      }
      case 'text': { return 'blue'
      }
      case 'pdf': { return 'red'
      }
      case 'word': { return 'blue-darken-3'
      }
      case 'excel': { return 'green-darken-1'
      }
      case 'powerpoint': { return 'deep-orange'
      }
      case 'archive': { return 'amber-darken-2'
      }
      case 'executable': { return 'grey-darken-3'
      }
      case 'code': { return 'light-blue'
      }
      default: { return 'grey'
      }
    }
  }

  // Expose methods to parent components
  defineExpose({
    openUploadDialog,
    openCreateFolderDialog,
  })
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.folder-card, .file-card {
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background-color: var(--v-theme-surface);
}

.folder-card:hover, .file-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.truncate-text {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.show-actions {
  opacity: 1;
}

.grid-item {
  cursor: pointer;
}

.file-card {
  cursor: default;
}

.list-item-hover {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

.list-header {
  background-color: rgba(var(--v-theme-surface-variant), 0.6);
  font-weight: 600;
  font-size: 0.85rem;
}

.action-buttons-list {
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  gap: 4px;
}

.empty-state {
  padding: 60px 0;
}

.explorer-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.search-field {
  max-width: 300px;
}

/* Folder & File icons styling */
.folder-icon-container, .file-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 8px;
}

.folder-icon-container {
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.15);
}

.file-icon-container {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.list-details-container {
  padding: 0 12px;
}

.action-buttons-container {
  display: flex;
  gap: 8px;
}

@media (max-width: 600px) {
  .list-view-container .v-list-item__append {
    flex-direction: column;
    align-items: flex-end;
  }

  .v-breadcrumbs {
    max-width: 150px;
    overflow: hidden;
  }
}
</style>
