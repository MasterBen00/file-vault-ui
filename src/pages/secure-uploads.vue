<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 my-4">Secure Encrypted File Uploads</h1>
        <p class="text-body-1 mb-4">
          Upload your files securely. You can set download limits, expiry times, and an optional password.
        </p>

        <!-- Navigation Tabs -->
        <v-tabs
          v-model="activeTab"
          bg-color="primary"
        >
          <v-tab value="upload">Upload New File</v-tab>
          <v-tab value="myUploads">My Uploaded Files</v-tab>
          <v-tab value="sharedByMe">Files I've Shared</v-tab>
          <v-tab value="sharedWithMe">Files Shared With Me</v-tab>
          <v-tab value="activity">File Activity</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <v-window v-model="activeTab">
      <!-- Upload New File Section -->
      <v-window-item value="upload">
        <v-row>
          <v-col cols="12" lg="6" md="8">
            <v-card class="my-4">
              <v-card-title>Upload New File</v-card-title>
              <v-card-text>
                <v-form @submit.prevent="handleFileUpload">
                  <v-file-input
                    v-model="selectedFile"
                    accept="*/*"
                    label="Select file"
                    prepend-icon="mdi-paperclip"
                    show-size
                    @change="onFileSelected"
                  />

                  <!-- Folder selector for upload -->
                  <v-select
                    v-model="selectedFolderId"
                    class="mt-4"
                    clearable
                    item-title="name"
                    item-value="id"
                    :items="availableFolders"
                    label="Upload to folder"
                    prepend-inner-icon="mdi-folder"
                    return-object
                  >
                    <template #prepend>
                      <v-icon color="primary">mdi-folder-upload</v-icon>
                    </template>
                  </v-select>

                  <v-text-field
                    v-model.number="maxDownloads"
                    class="mt-4"
                    label="Maximum Downloads"
                    min="1"
                    type="number"
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
                    hint="If not provided, file will never expire"
                    label="Expiry Minutes (leave empty for no expiry)"
                    min="1"
                    persistent-hint
                    type="number"
                  />

                  <v-text-field
                    v-model="password"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    class="mt-4"
                    label="Password (Optional)"
                    prepend-inner-icon="mdi-lock-outline"
                    :type="showPassword ? 'text' : 'password'"
                    @click:append-inner="showPassword = !showPassword"
                  />

                  <v-btn
                    class="mt-6"
                    color="primary"
                    :disabled="!selectedFile || isUploading"
                    :loading="isUploading"
                    type="submit"
                  >
                    Upload File
                  </v-btn>
                </v-form>
                <v-alert
                  v-if="uploadMessage"
                  class="mt-4"
                  density="compact"
                  :type="uploadMessageType"
                >
                  {{ uploadMessage }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- My Uploaded Files Section -->
      <v-window-item value="myUploads">
        <v-row>
          <v-col cols="12">
            <v-card class="my-4">
              <v-card-title class="d-flex justify-space-between align-center">
                <div>My Uploaded Files</div>
                <div>
                  <v-btn
                    color="success"
                    prepend-icon="mdi-folder-plus"
                    size="small"
                    @click="() => openCreateFolderDialog()"
                  >
                    New Folder
                  </v-btn>
                </div>
              </v-card-title>

              <v-card-text>
                <!-- Breadcrumb Navigation -->
                <v-breadcrumbs v-if="folderPath.length > 0 || currentFolderId" class="pl-0 pb-2">
                  <template #prepend>
                    <v-icon class="mr-1 cursor-pointer" icon="mdi-folder-home-outline" @click="navigateToRoot" />
                  </template>
                  <v-breadcrumbs-item
                    v-for="folder in folderPath"
                    :key="folder.id"
                    class="cursor-pointer"
                    :title="folder.name"
                    @click="navigateToFolder(folder.id)"
                  />
                </v-breadcrumbs>

                <div v-if="isLoadingFolders">Loading folder contents...</div>
                <v-alert v-else-if="folderError" type="error">{{ folderError }}</v-alert>
                <div v-else class="folder-content">
                  <!-- Folders List -->
                  <v-list v-if="folderContents.folders.length > 0" class="mb-3">
                    <v-list-subheader>Folders</v-list-subheader>
                    <v-list-item
                      v-for="folder in folderContents.folders"
                      :key="folder.id"
                      :subtitle="`Created: ${new Date(folder.createdAt).toLocaleString()}`"
                      :title="folder.name"
                      @click="navigateToFolder(folder.id)"
                    >
                      <template #prepend>
                        <v-icon color="amber" icon="mdi-folder" />
                      </template>
                      <template #append>
                        <v-menu>
                          <template #activator="{ props }">
                            <v-btn
                              icon="mdi-dots-vertical"
                              size="small"
                              v-bind="props"
                              @click.stop
                            />
                          </template>
                          <v-list>
                            <v-list-item @click.stop="openRenameFolderDialog(folder)">
                              <template #prepend>
                                <v-icon>mdi-pencil</v-icon>
                              </template>
                              <v-list-item-title>Rename</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click.stop="openDeleteFolderDialog(folder)">
                              <template #prepend>
                                <v-icon>mdi-delete</v-icon>
                              </template>
                              <v-list-item-title>Delete</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </template>
                    </v-list-item>
                  </v-list>

                  <!-- Files List -->
                  <v-list v-if="folderContents.files.length > 0">
                    <v-list-subheader v-if="folderContents.folders.length > 0">Files</v-list-subheader>
                    <v-list-item
                      v-for="file in folderContents.files"
                      :key="file.id"
                      :subtitle="`Size: ${formatFileSize(file.fileSize)}, Uploaded: ${new Date(file.uploadTime).toLocaleString()}, Expires: ${new Date(file.expiryTime).toLocaleString()}, Downloads: ${file.downloadCount}/${file.maxDownloads}${file.fileType ? ', Type: ' + file.fileType : ''}${file.mimeType ? ', Format: ' + file.mimeType : ''}`"
                      :title="file.originalFileName"
                    >
                      <template #prepend>
                        <v-icon>mdi-file-document-outline</v-icon>
                      </template>
                      <v-chip
                        class="ml-2"
                        :color="file.passwordProtected ? 'orange' : 'green'"
                        size="small"
                      >
                        {{ file.passwordProtected ? 'Password Protected' : 'Open Access' }}
                      </v-chip>
                      <v-btn
                        class="ml-4"
                        color="primary"
                        size="small"
                        @click="() => handleDownload(file)"
                      >
                        <v-icon start>mdi-download</v-icon>
                        Download
                      </v-btn>
                      <v-btn
                        class="ml-2"
                        color="success"
                        size="small"
                        @click="() => openShareDialog(file)"
                      >
                        <v-icon start>mdi-share</v-icon>
                        Share
                      </v-btn>
                      <v-btn
                        class="ml-2"
                        color="error"
                        size="small"
                        @click="() => confirmDeleteFile(file)"
                      >
                        <v-icon start>mdi-delete</v-icon>
                        Delete
                      </v-btn>
                    </v-list-item>
                  </v-list>

                  <!-- Empty Folder Message -->
                  <div v-if="folderContents.folders.length === 0 && folderContents.files.length === 0" class="text-center pa-4">
                    <v-icon color="grey-lighten-1" icon="mdi-folder-outline" size="64" />
                    <p class="text-body-1 mt-2">This folder is empty.</p>
                    <p class="text-caption text-medium-emphasis">
                      Upload files or create folders to organize your content.
                    </p>
                  </div>
                </div>

                <!-- Original file list can be removed as we're using the folderContents now -->
                <v-alert
                  v-if="myUploadsError"
                  class="mt-4"
                  density="compact"
                  type="error"
                >
                  {{ myUploadsError }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Files Shared by Me Section -->
      <v-window-item value="sharedByMe">
        <v-row>
          <v-col cols="12">
            <v-card class="my-4">
              <v-card-title>Files I've Shared</v-card-title>
              <v-card-text>
                <div v-if="isLoadingFilesSharedByMe">Loading files you've shared...</div>
                <div v-else-if="filesSharedByMe.length === 0">You haven't shared any files yet.</div>
                <v-expansion-panels v-else>
                  <v-expansion-panel v-for="sharedFile in paginatedFilesSharedByMe" :key="sharedFile.file.id">
                    <v-expansion-panel-title>
                      <v-row no-gutters>
                        <v-col cols="10">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2">mdi-file-document-outline</v-icon>
                            <span>{{ sharedFile.file.originalFileName }}</span>
                            <v-chip
                              class="ml-2"
                              :color="sharedFile.file.passwordProtected ? 'orange' : 'green'"
                              size="small"
                            >
                              {{ sharedFile.file.passwordProtected ? 'Password Protected' : 'Open Access' }}
                            </v-chip>
                          </div>
                        </v-col>
                        <v-col class="text-right" cols="2">
                          <span class="text-caption">Shared with {{ sharedFile.sharedWithUsers.length }} users</span>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-list density="compact">
                        <v-list-subheader>Shared with:</v-list-subheader>
                        <v-list-item v-for="(userShareInfo, index) in sharedFile.sharedWithUsers" :key="index">
                          <template #prepend>
                            <v-icon>mdi-email</v-icon>
                          </template>
                          <v-list-item-title>{{ userShareInfo.email }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                      <div class="d-flex mt-2">
                        <v-btn
                          class="mr-2"
                          color="primary"
                          size="small"
                          @click="() => handleDownload(sharedFile.file)"
                        >
                          <v-icon start>mdi-download</v-icon>
                          Download
                        </v-btn>
                        <v-btn
                          color="success"
                          size="small"
                          @click="() => openShareDialog(sharedFile.file)"
                        >
                          <v-icon start>mdi-account-plus</v-icon>
                          Share with More
                        </v-btn>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
                <div v-if="filesSharedByMe.length > 0" class="d-flex align-center justify-space-between mt-4">
                  <v-pagination
                    v-model="sharedByMePage"
                    :length="Math.ceil(filesSharedByMe.length / sharedByMePerPage)"
                    rounded
                    :total-visible="5"
                  />
                  <div class="d-flex align-center">
                    <span class="text-caption mr-2">Items per page:</span>
                    <v-select
                      v-model="sharedByMePerPage"
                      class="pagination-select"
                      density="compact"
                      hide-details
                      :items="sharedByMeItemsPerPageOptions"
                      variant="outlined"
                    />
                  </div>
                </div>
                <v-alert
                  v-if="filesSharedByMeError"
                  class="mt-4"
                  density="compact"
                  type="error"
                >
                  {{ filesSharedByMeError }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Files Shared with Me Section -->
      <v-window-item value="sharedWithMe">
        <v-row>
          <v-col cols="12">
            <v-card class="my-4">
              <v-card-title>Files Shared with Me</v-card-title>
              <v-card-text>
                <div v-if="isLoadingFilesSharedWithMe">Loading files shared with you...</div>
                <div v-else-if="filesSharedWithMe.length === 0">No files have been shared with you yet.</div>
                <v-list v-else>
                  <v-list-item
                    v-for="item in paginatedFilesSharedWithMe"
                    :key="item.file.id"
                    :subtitle="`Size: ${formatFileSize(item.file.fileSize)}, Uploaded by: ${item.file.uploaderUsername}, Shared by: ${item.sharedBy}, Expires: ${new Date(item.file.expiryTime).toLocaleString()}, Downloads: ${item.file.downloadCount}/${item.file.maxDownloads}`"
                    :title="item.file.originalFileName"
                  >
                    <template #prepend>
                      <v-icon>mdi-file-document-outline</v-icon>
                    </template>
                    <v-chip
                      class="ml-2"
                      :color="item.file.passwordProtected ? 'orange' : 'green'"
                      size="small"
                    >
                      {{ item.file.passwordProtected ? 'Password Protected' : 'Open Access' }}
                    </v-chip>
                    <v-btn
                      class="ml-4"
                      color="primary"
                      size="small"
                      @click="() => handleDownload(item.file)"
                    >
                      <v-icon start>mdi-download</v-icon>
                      Download
                    </v-btn>
                  </v-list-item>
                </v-list>
                <div v-if="filesSharedWithMe.length > 0" class="d-flex align-center justify-space-between mt-4">
                  <v-pagination
                    v-model="sharedWithMePage"
                    :length="Math.ceil(filesSharedWithMe.length / sharedWithMePerPage)"
                    rounded
                    :total-visible="5"
                  />
                  <div class="d-flex align-center">
                    <span class="text-caption mr-2">Items per page:</span>
                    <v-select
                      v-model="sharedWithMePerPage"
                      class="pagination-select"
                      density="compact"
                      hide-details
                      :items="sharedWithMeItemsPerPageOptions"
                      variant="outlined"
                    />
                  </div>
                </div>
                <v-alert
                  v-if="filesSharedWithMeError"
                  class="mt-4"
                  density="compact"
                  type="error"
                >
                  {{ filesSharedWithMeError }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- File Sharing Activity Section -->
      <v-window-item value="activity">
        <v-row>
          <v-col cols="12">
            <v-card class="my-4">
              <v-card-title>File Sharing Activity</v-card-title>
              <v-card-text>
                <div v-if="sharingActivity.length > 0">
                  <div v-for="activity in paginatedActivity" :key="activity.fileInfo.id" class="mb-6">
                    <h3 class="text-subtitle-1 font-weight-bold">{{ activity.fileInfo.originalFileName }}</h3>
                    <p class="text-caption">Uploaded: {{ new Date(activity.fileInfo.uploadTime).toLocaleString() }}</p>
                    <v-list v-if="activity.downloads.length > 0" density="compact">
                      <v-list-subheader>Download Logs:</v-list-subheader>
                      <v-list-item
                        v-for="log in getPaginatedDownloadLogs(activity.downloads, activity.fileInfo.id)"
                        :key="log.id"
                        :subtitle="`Time: ${new Date(log.downloadTime).toLocaleString()}, User Agent: ${log.userAgent}`"
                        :title="`Downloaded by: ${log.downloaderUsername || 'Anonymous'} (IP: ${log.downloaderIp})`"
                      >
                        <template #prepend>
                          <v-icon>mdi-download-outline</v-icon>
                        </template>
                      </v-list-item>

                      <!-- Download logs pagination controls -->
                      <div v-if="activity.downloads.length > 0" class="d-flex align-center justify-space-between mt-2">
                        <v-pagination
                          v-model="downloadLogsPage[activity.fileInfo.id]"
                          density="compact"
                          :length="Math.ceil(activity.downloads.length / downloadLogsPerPage)"
                          rounded
                          size="small"
                          :total-visible="3"
                        />
                        <div class="d-flex align-center">
                          <span class="text-caption mr-2">Items per page:</span>
                          <v-select
                            v-model="downloadLogsPerPage"
                            class="pagination-select"
                            density="compact"
                            hide-details
                            :items="downloadLogsItemsPerPageOptions"
                            style="max-width: 80px;"
                            variant="outlined"
                          />
                        </div>
                      </div>
                    </v-list>
                    <p v-else class="text-caption">No downloads for this file yet.</p>
                  </div>

                  <div class="d-flex align-center justify-space-between mt-4">
                    <v-pagination
                      v-model="activityPage"
                      :length="Math.ceil(sharingActivity.length / activityPerPage)"
                      rounded
                      :total-visible="5"
                    />
                    <div class="d-flex align-center">
                      <span class="text-caption mr-2">Items per page:</span>
                      <v-select
                        v-model="activityPerPage"
                        class="pagination-select"
                        density="compact"
                        hide-details
                        :items="activityItemsPerPageOptions"
                        variant="outlined"
                      />
                    </div>
                  </div>
                </div>
                <p v-else-if="isLoadingSharingActivity">Loading sharing activity...</p>
                <p v-else>No sharing activity to display.</p>
                <v-alert
                  v-if="sharingActivityError"
                  class="mt-4"
                  density="compact"
                  type="error"
                >
                  {{ sharingActivityError }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Password Protected Download Dialog -->
    <v-dialog v-model="downloadDialog" persistent>
      <v-card>
        <v-card-title>Password Required</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="downloadPassword"
            label="Enter Password"
            type="password"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="confirmPasswordDownload">Download</v-btn>
          <v-btn color="secondary" @click="downloadDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share File Dialog -->
    <v-dialog v-model="shareDialog" max-width="600">
      <v-card>
        <v-card-title>Share File</v-card-title>
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
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" :disabled="isSharing || emailsToShare.length === 0" :loading="isSharing" @click="shareFileWithUsers">
            Share
          </v-btn>
          <v-btn color="secondary" @click="closeShareDialog">Cancel</v-btn>
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ fileToDelete?.originalFileName }}</strong>?</p>
          <p class="text-caption text-red">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey-lighten-1" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            variant="elevated"
            @click="executeFileDelete"
          >
            Delete File
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- New Folder Functionality Dialogs -->

    <!-- Create Folder Dialog -->
    <v-dialog v-model="createFolderDialog" max-width="400">
      <v-card>
        <v-card-title>Create New Folder</v-card-title>
        <v-card-text>
          <v-form ref="createFolderForm" v-model="isCreatingFolder">
            <v-text-field
              v-model="newFolderName"
              autofocus
              label="Folder Name"
              :rules="folderNameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            :disabled="!newFolderName"
            :loading="isCreatingFolder"
            @click="createFolder"
          >
            Create Folder
          </v-btn>
          <v-btn color="secondary" @click="createFolderDialog = false">Cancel</v-btn>
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
      <v-card>
        <v-card-title>Rename Folder</v-card-title>
        <v-card-text>
          <v-form ref="renameFolderForm" v-model="isRenamingFolder">
            <v-text-field
              v-model="updatedFolderName"
              autofocus
              label="New Folder Name"
              :rules="folderNameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            :disabled="!updatedFolderName"
            :loading="isRenamingFolder"
            @click="renameFolder"
          >
            Rename Folder
          </v-btn>
          <v-btn color="secondary" @click="renameFolderDialog = false">Cancel</v-btn>
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
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          Confirm Delete Folder
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete the folder <strong>{{ folderToDelete?.name }}</strong>?</p>
          <p class="text-caption text-red">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey-lighten-1" variant="text" @click="deleteFolderDialog = false">Cancel</v-btn>
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

    <v-alert
      v-if="downloadMessage"
      class="mt-4"
      density="compact"
      :type="downloadMessageType"
    >
      {{ downloadMessage }}
    </v-alert>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  // Explicitly import all Vuetify components used in the template
  import {
    VAlert, VBreadcrumbs, VBreadcrumbsItem, VBtn, VCard, VCardActions, VCardText, VCardTitle, VChip, VCol,
    VCombobox, VContainer, VDialog, VDivider, VExpansionPanel, VExpansionPanels, VExpansionPanelText,
    VExpansionPanelTitle, VFileInput, VForm, VIcon, VList, VListItem, VListItemTitle,
    VListSubheader, VPagination, VRow, VSelect, VSpacer, VTab, VTabs, VTextField,
    VWindow, VWindowItem,
  } from 'vuetify/components'
  import fileService, {
    type DownloadLogResponseDto,
    type FileMetaResponseDto,
    type FileSharingActivityDto,
    type SharedByMeItemDto,
    type SharedWithMeItemDto,
  } from '@/services/fileService'
  import folderService, { type FolderContentsDto, type FolderDto } from '@/services/folderService'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const activeTab = ref('upload') // Default active tab

  // Pagination variables for My Uploads
  const myUploadsPage = ref<number>(1)
  const myUploadsPerPage = ref<number>(5) // Default items per page
  const myUploadsItemsPerPageOptions = [5, 10, 25, 50]

  // Pagination variables for file activity
  const activityPage = ref<number>(1)
  const activityPerPage = ref<number>(5) // Default items per page
  const activityItemsPerPageOptions = [5, 10, 25, 50]

  // Pagination variables for Files Shared by Me
  const sharedByMePage = ref<number>(1)
  const sharedByMePerPage = ref<number>(5) // Default items per page
  const sharedByMeItemsPerPageOptions = [5, 10, 25, 50]

  // Pagination variables for Files Shared with Me
  const sharedWithMePage = ref<number>(1)
  const sharedWithMePerPage = ref<number>(5) // Default items per page
  const sharedWithMeItemsPerPageOptions = [5, 10, 25, 50]

  // Pagination variables for download logs in activity
  const downloadLogsPage = ref<Record<string, number>>({}) // Map fileId -> page number
  const downloadLogsPerPage = ref<number>(5) // Default items per page
  const downloadLogsItemsPerPageOptions = [5, 10, 25, 50]

  const selectedFile = ref<File | null>(null)
  const maxDownloads = ref<number>(10)
  const enableExpiry = ref<boolean>(false) // New ref to control expiry time visibility and inclusion
  const expiryMinutes = ref<number>(1440) // Default to 24 hours
  const password = ref<string>('')
  const showPassword = ref<boolean>(false)
  const isUploading = ref<boolean>(false)
  const uploadMessage = ref<string | null>(null)
  const uploadMessageType = ref<'success' | 'error'>('success')

  const myUploads = ref<FileMetaResponseDto[]>([])
  const isLoadingMyUploads = ref<boolean>(false)
  const myUploadsError = ref<string | null>(null)

  const sharingActivity = ref<FileSharingActivityDto[]>([])
  const isLoadingSharingActivity = ref<boolean>(false)
  const sharingActivityError = ref<string | null>(null)

  const downloadMessage = ref<string | null>(null)
  const downloadMessageType = ref<'success' | 'error'>('success')
  const downloadPassword = ref<string>('')
  const downloadDialog = ref<boolean>(false)
  const downloadFileRef = ref<FileMetaResponseDto | null>(null)

  // New refs for file sharing functionality
  const filesSharedByMe = ref<SharedByMeItemDto[]>([])
  const isLoadingFilesSharedByMe = ref<boolean>(false)
  const filesSharedByMeError = ref<string | null>(null)

  const filesSharedWithMe = ref<Array<SharedWithMeItemDto>>([])
  const isLoadingFilesSharedWithMe = ref<boolean>(false)
  const filesSharedWithMeError = ref<string | null>(null)

  const shareDialog = ref<boolean>(false)
  const fileToShare = ref<FileMetaResponseDto | null>(null)
  const emailsToShare = ref<string[]>([])
  const isSharing = ref<boolean>(false)
  const shareResult = ref<{ shared?: string[], alreadyShared?: string[], notFound?: string[] } | null>(null)

  // Variables for delete confirmation dialog
  const deleteDialog = ref<boolean>(false)
  const fileToDelete = ref<FileMetaResponseDto | null>(null)
  const isDeleting = ref<boolean>(false)

  // New variables for folder functionality
  const currentFolderId = ref<string | null>(null)
  const folderPath = ref<FolderDto[]>([])
  const folderContents = ref<FolderContentsDto>({ folders: [], files: [] })
  const isLoadingFolders = ref<boolean>(false)
  const folderError = ref<string | null>(null)

  // Folder selection for upload
  const selectedFolderId = ref<FolderDto | null>(null)
  const availableFolders = ref<FolderDto[]>([])
  const isLoadingAvailableFolders = ref<boolean>(false)

  // Create folder dialog
  const createFolderDialog = ref<boolean>(false)
  const newFolderName = ref<string>('')
  const isCreatingFolder = ref<boolean>(false)
  const createFolderError = ref<string | null>(null)
  const folderNameRules = [
    (v: string) => !!v || 'Folder name is required',
    (v: string) => (v && v.length > 0) || 'Folder name must be at least 1 character',
    (v: string) => (v && v.length <= 255) || 'Folder name must be less than 255 characters',
    (v: string) => /^[^\\\/\:\*\?\"\<\>\|]+$/.test(v) || 'Folder name contains invalid characters',
  ]

  // Rename folder dialog
  const renameFolderDialog = ref<boolean>(false)
  const folderToRename = ref<FolderDto | null>(null)
  const updatedFolderName = ref<string>('')
  const isRenamingFolder = ref<boolean>(false)
  const renameFolderError = ref<string | null>(null)

  // Delete folder dialog
  const deleteFolderDialog = ref<boolean>(false)
  const folderToDelete = ref<FolderDto | null>(null)
  const deleteFolderForce = ref<boolean>(false)
  const isDeletingFolder = ref<boolean>(false)

  // Folder navigation methods
  const navigateToRoot = () => {
    currentFolderId.value = null
  }

  const navigateToFolder = (folderId: string) => {
    currentFolderId.value = folderId
  }

  const openCreateFolderDialog = () => {
    newFolderName.value = ''
    createFolderError.value = null
    createFolderDialog.value = true
  }

  const onFileSelected = (event: Event) => {
    const target = event.target as HTMLInputElement
    selectedFile.value = target.files && target.files[0] ? target.files[0] : null
  }

  const handleFileUpload = async () => {
    if (!selectedFile.value) {
      uploadMessage.value = 'Please select a file.'
      uploadMessageType.value = 'error'
      return
    }
    if (!authStore.token) {
      uploadMessage.value = 'You must be logged in to upload files.'
      uploadMessageType.value = 'error'
      return
    }

    isUploading.value = true
    uploadMessage.value = null

    try {
      await fileService.uploadFile(
        selectedFile.value,
        maxDownloads.value,
        // Only pass expiryMinutes if it's explicitly set (not null)
        enableExpiry.value ? expiryMinutes.value : undefined,
        password.value || undefined,
        // Include the selected folder ID in the upload request
        selectedFolderId.value?.id || undefined,
      )
      uploadMessage.value = 'File uploaded successfully!'
      uploadMessageType.value = 'success'
      selectedFile.value = null
      password.value = ''
      await fetchMyUploads()
      await fetchSharingActivity()
    } catch (error: any) {
      console.error('File upload failed:', error)
      // Extract error message from API response
      if (error.response?.data) {
        // Handle case where error response is a string
        if (typeof error.response.data === 'string') {
          uploadMessage.value = error.response.data
        }
        // Handle case where error response has a message property
        else if (error.response.data.message) {
          uploadMessage.value = error.response.data.message
        }
        // Handle case where error response has an error property
        else if (error.response.data.error) {
          uploadMessage.value = error.response.data.error
        }
        // Handle other structured error responses
        else {
          uploadMessage.value = `Upload failed: ${JSON.stringify(error.response.data)}`
        }
      } else {
        uploadMessage.value = error.message || 'File upload failed. Please try again.'
      }
      uploadMessageType.value = 'error'
    } finally {
      isUploading.value = false
    }
  }

  const fetchMyUploads = async () => {
    isLoadingMyUploads.value = true
    myUploadsError.value = null
    try {
      myUploads.value = await fileService.getMyUploads()
    } catch (error: any) {
      console.error('Failed to fetch user uploads:', error)
      myUploadsError.value = error.response?.data?.message || error.message || 'Failed to load your uploaded files.'
    } finally {
      isLoadingMyUploads.value = false
    }
  }

  const fetchSharingActivity = async () => {
    isLoadingSharingActivity.value = true
    sharingActivityError.value = null
    try {
      sharingActivity.value = await fileService.getShareActivity()
    } catch (error: any) {
      console.error('Failed to fetch sharing activity:', error)
      sharingActivityError.value = error.response?.data?.message || error.message || 'Failed to load sharing activity.'
    } finally {
      isLoadingSharingActivity.value = false
    }
  }

  // New functions for file sharing functionality
  const fetchFilesSharedByMe = async () => {
    isLoadingFilesSharedByMe.value = true
    filesSharedByMeError.value = null
    try {
      filesSharedByMe.value = await fileService.getFilesSharedByMe()
    } catch (error: any) {
      console.error('Failed to fetch files shared by me:', error)
      filesSharedByMeError.value = error.response?.data?.message || error.message || 'Failed to load files you\'ve shared.'
    } finally {
      isLoadingFilesSharedByMe.value = false
    }
  }

  const fetchFilesSharedWithMe = async () => {
    isLoadingFilesSharedWithMe.value = true
    filesSharedWithMeError.value = null
    try {
      filesSharedWithMe.value = await fileService.getFilesSharedWithMe()
    } catch (error: any) {
      console.error('Failed to fetch files shared with me:', error)
      filesSharedWithMeError.value = error.response?.data?.message || error.message || 'Failed to load files shared with you.'
    } finally {
      isLoadingFilesSharedWithMe.value = false
    }
  }

  const openShareDialog = (file: FileMetaResponseDto) => {
    fileToShare.value = file
    emailsToShare.value = []
    shareResult.value = null
    shareDialog.value = true
  }

  const closeShareDialog = () => {
    shareDialog.value = false
    fileToShare.value = null
    emailsToShare.value = []
    shareResult.value = null
  }

  const shareFileWithUsers = async () => {
    if (!fileToShare.value || emailsToShare.value.length === 0) {
      return
    }

    isSharing.value = true
    shareResult.value = null

    try {
      shareResult.value = await fileService.shareFileWithUsers(fileToShare.value.id, emailsToShare.value)
      // If sharing was successful, refresh the shared files lists
      if (shareResult.value.shared && shareResult.value.shared.length > 0) {
        await fetchFilesSharedByMe()
      }
    } catch (error: any) {
      console.error('Failed to share file:', error)
      shareResult.value = {
        notFound: ['Failed to share file: ' + (error.response?.data?.message || error.message || 'Unknown error')],
      }
    } finally {
      isSharing.value = false
    }
  }

  // Computed properties for pagination
  const paginatedMyUploads = computed(() => {
    const start = (myUploadsPage.value - 1) * myUploadsPerPage.value
    const end = start + myUploadsPerPage.value
    return myUploads.value.slice(start, end)
  })

  const paginatedFilesSharedByMe = computed(() => {
    const start = (sharedByMePage.value - 1) * sharedByMePerPage.value
    const end = start + sharedByMePerPage.value
    return filesSharedByMe.value.slice(start, end)
  })

  const paginatedFilesSharedWithMe = computed(() => {
    const start = (sharedWithMePage.value - 1) * sharedWithMePerPage.value
    const end = start + sharedWithMePerPage.value
    return filesSharedWithMe.value.slice(start, end)
  })

  const paginatedActivity = computed(() => {
    const start = (activityPage.value - 1) * activityPerPage.value
    const end = start + activityPerPage.value
    return sharingActivity.value.slice(start, end)
  })

  // Function to get paginated download logs for a specific activity
  const getPaginatedDownloadLogs = (downloads: DownloadLogResponseDto[], fileId: string) => {
    const activityDownloadsPage = downloadLogsPage.value[fileId] || 1
    const start = (activityDownloadsPage - 1) * downloadLogsPerPage.value
    const end = start + downloadLogsPerPage.value
    return downloads.slice(start, end)
  }

  // Confirm file deletion with a prompt
  const confirmDeleteFile = async (file: FileMetaResponseDto) => {
    fileToDelete.value = file
    deleteDialog.value = true
  }

  const executeFileDelete = async () => {
    if (!fileToDelete.value) return

    isDeleting.value = true
    deleteDialog.value = false

    try {
      await fileService.deleteFile(fileToDelete.value.id)
      downloadMessage.value = 'File deleted successfully'
      downloadMessageType.value = 'success'
      fetchMyUploads() // Refresh the list of files
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      downloadMessage.value = error.response?.data?.message || error.message || 'Failed to delete file.'
      downloadMessageType.value = 'error'
    } finally {
      isDeleting.value = false
    }
  }

  // New functions for folder functionality
  const fetchFolderContents = async (folderId: string | null) => {
    isLoadingFolders.value = true
    folderError.value = null
    try {
      currentFolderId.value = folderId
      // Fetch folder contents by folder ID, or root contents if folderId is null
      folderContents.value = folderId
        ? await folderService.getFolderContents(folderId)
        : await folderService.getRootFolderContents()

      // Update folder path for breadcrumb navigation
      folderPath.value = folderId
        ? await folderService.getFolderPath(folderId)
        : []
    } catch (error: any) {
      console.error('Failed to fetch folder contents:', error)
      folderError.value = error.response?.data?.message || error.message || 'Failed to load folder contents.'
    } finally {
      isLoadingFolders.value = false
    }
  }

  const fetchAvailableFolders = async () => {
    isLoadingAvailableFolders.value = true
    try {
      availableFolders.value = await folderService.getAvailableFolders()
    } catch (error: any) {
      console.error('Failed to fetch available folders:', error)
      availableFolders.value = []
    } finally {
      isLoadingAvailableFolders.value = false
    }
  }

  const createFolder = async () => {
    if (!newFolderName.value.trim() || !currentFolderId.value) return

    isCreatingFolder.value = true
    createFolderError.value = null

    try {
      await folderService.createFolder(currentFolderId.value, newFolderName.value.trim())
      newFolderName.value = ''
      createFolderDialog.value = false
      // Refresh folder contents
      await fetchFolderContents(currentFolderId.value)
    } catch (error: any) {
      console.error('Failed to create folder:', error)
      createFolderError.value = error.response?.data?.message || error.message || 'Failed to create folder.'
    } finally {
      isCreatingFolder.value = false
    }
  }

  const openRenameFolderDialog = (folder: FolderDto) => {
    folderToRename.value = folder
    updatedFolderName.value = folder.name
    renameFolderDialog.value = true
  }

  const renameFolder = async () => {
    if (!folderToRename.value || !updatedFolderName.value.trim()) return

    isRenamingFolder.value = true
    renameFolderError.value = null

    try {
      await folderService.renameFolder(folderToRename.value.id, updatedFolderName.value.trim())
      updatedFolderName.value = ''
      renameFolderDialog.value = false
      // Refresh folder contents
      await fetchFolderContents(currentFolderId.value)
    } catch (error: any) {
      console.error('Failed to rename folder:', error)
      renameFolderError.value = error.response?.data?.message || error.message || 'Failed to rename folder.'
    } finally {
      isRenamingFolder.value = false
    }
  }

  const openDeleteFolderDialog = (folder: FolderDto) => {
    folderToDelete.value = folder
    deleteFolderDialog.value = true
  }

  const executeFolderDelete = async () => {
    if (!folderToDelete.value) return

    isDeletingFolder.value = true
    deleteFolderDialog.value = false

    try {
      await folderService.deleteFolder(folderToDelete.value.id, deleteFolderForce.value)
      downloadMessage.value = 'Folder deleted successfully'
      downloadMessageType.value = 'success'
      // Refresh folder contents
      await fetchFolderContents(currentFolderId.value)
    } catch (error: any) {
      console.error('Failed to delete folder:', error)
      downloadMessage.value = error.response?.data?.message || error.message || 'Failed to delete folder.'
      downloadMessageType.value = 'error'
    } finally {
      isDeletingFolder.value = false
    }
  }

  const formatFileSize = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = Math.max(decimals, 0)
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  const handleDownload = async (file: FileMetaResponseDto) => {
    if (file.passwordProtected) {
      // If the file is password protected, open the password dialog
      downloadFileRef.value = file
      downloadDialog.value = true
    } else {
      // Direct download
      try {
        const blob = await fileService.downloadFile(file.id)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.originalFileName
        document.body.append(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        downloadMessage.value = 'Download started for ' + file.originalFileName
        downloadMessageType.value = 'success'
      } catch (error: any) {
        console.error('File download failed:', error)
        downloadMessage.value = error.response?.data?.message || error.message || 'File download failed. Please try again.'
        downloadMessageType.value = 'error'
      }
    }
  }

  const confirmPasswordDownload = async () => {
    if (!downloadPassword.value || !downloadFileRef.value) return

    try {
      // Attempt to download the file with the provided password
      const blob = await fileService.downloadFile(downloadFileRef.value.id, downloadPassword.value)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadFileRef.value.originalFileName
      document.body.append(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      downloadDialog.value = false
      downloadPassword.value = ''
      downloadMessage.value = 'Download started for ' + downloadFileRef.value.originalFileName
      downloadMessageType.value = 'success'
    } catch (error: any) {
      console.error('Password protected file download failed:', error)
      downloadMessage.value = error.response?.data?.message || error.message || 'Failed to download file. Please check the password and try again.'
      downloadMessageType.value = 'error'
    }
  }

  // Initial data fetch
  onMounted(() => {
    fetchMyUploads()
    fetchSharingActivity()
    fetchFilesSharedByMe()
    fetchFilesSharedWithMe()
    fetchFolderContents(null) // Fetch root folder contents on initial load
    fetchAvailableFolders() // Fetch available folders for upload
  })

  // Watchers for pagination and tab changes
  watch(myUploadsPage, () => {
    fetchMyUploads()
  })

  watch(myUploadsPerPage, () => {
    fetchMyUploads()
  })

  watch(activityPage, () => {
    fetchSharingActivity()
  })

  watch(activityPerPage, () => {
    fetchSharingActivity()
  })

  watch(sharedByMePage, () => {
    fetchFilesSharedByMe()
  })

  watch(sharedByMePerPage, () => {
    fetchFilesSharedByMe()
  })

  watch(sharedWithMePage, () => {
    fetchFilesSharedWithMe()
  })

  watch(sharedWithMePerPage, () => {
    fetchFilesSharedWithMe()
  })

  // Watcher for folder contents
  watch(currentFolderId, newFolderId => {
    fetchFolderContents(newFolderId)
  })
</script>

<style scoped>
.pagination-select {
  max-width: 100px;
}

/* Removed .qr-code-image style as QR functionality is removed from this page
.qr-code-image {
  max-width: 100%;
  height: auto;
}
*/
</style>
