# Folder API Documentation

Base URL: `/api/folders`

---

## Folder Object
```json
{
  "id": "string", // Unique identifier for the folder
  "name": "string", // Name of the folder
  "parentId": "string", // ID of the parent folder (null if root folder)
  "ownerUsername": "string", // Username of the folder owner
  "organizationId": "string", // ID of the organization this folder belongs to
  "createdAt": "2025-06-10T10:00:00", // Timestamp of creation
  "updatedAt": "2025-06-10T10:00:00"  // Timestamp of last update
}
```

---

## Create Folder
- **URL:** `/api/folders`
- **Method:** `POST`
- **Auth:** User
- **Request Body:**
  ```json
  {
    "name": "string", // Name for the new folder
    "parentId": "string" // Optional: ID of the parent folder. If null or not provided, created in user's root.
  }
  ```
- **Response:**
  - `201 Created` — Returns the created folder object.
  - Example:
    ```json
    {
      "id": "uuid-string",
      "name": "Documents",
      "parentId": "parent-uuid-string",
      "ownerUsername": "john.doe",
      "organizationId": "org-uuid-string",
      "createdAt": "2025-06-10T10:00:00",
      "updatedAt": "2025-06-10T10:00:00"
    }
    ```
- **Errors:**
  - `400 Bad Request` — Invalid name, or parentId does not exist/belong to user.
  - `401 Unauthorized` — Not authenticated.
  - `409 Conflict` — A folder with the same name already exists in the target parent folder.

---

## Get Folder Contents (and Root Listing)
- **URL:** `/api/folders/contents`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `parentId`: string (optional) — ID of the folder whose contents are to be listed. If not provided, lists root folders and files for the user.
- **Response:**
  - `200 OK` — Returns a list of folder and file objects.
  - Example:
    ```json
    {
      "folders": [
        {
          "id": "uuid-string",
          "name": "Documents",
          "parentId": "parent-uuid-string",
          "ownerUsername": "john.doe",
          "organizationId": "org-uuid-string",
          "createdAt": "2025-06-10T10:00:00",
          "updatedAt": "2025-06-10T10:00:00"
        }
      ],
      "files": [
        {
          "id": "file-uuid-string",
          "originalFileName": "example.pdf",
          "fileSize": 1024,
          "uploadTime": "2025-06-08T12:00:00",
          "expiryTime": "2025-06-09T12:00:00",
          "maxDownloads": 5,
          "downloadCount": 1,
          "passwordProtected": true,
          "version": 1,
          "uploaderUsername": "john.doe",
          "organizationId": "org-uuid-string",
          "organizationName": "ExampleOrg",
          "fileType": "DOCUMENT",
          "mimeType": "application/pdf",
          "folderId": "parent-uuid-string"
        }
      ]
    }
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated.
  - `404 Not Found` — If `parentId` is provided and folder does not exist or user has no access.

---

## Get Folder Details
- **URL:** `/api/folders/{folderId}`
- **Method:** `GET`
- **Auth:** User
- **Response:**
  - `200 OK` — Returns the folder object.
  - Example:
    ```json
    {
      "id": "uuid-string",
      "name": "Documents",
      "parentId": "parent-uuid-string",
      "ownerUsername": "john.doe",
      "organizationId": "org-uuid-string",
      "createdAt": "2025-06-10T10:00:00",
      "updatedAt": "2025-06-10T10:00:00"
    }
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated.
  - `404 Not Found` — Folder not found or user has no access.

---

## Update Folder (Rename)
- **URL:** `/api/folders/{folderId}`
- **Method:** `PUT`
- **Auth:** User (owner or with appropriate permissions)
- **Request Body:**
  ```json
  {
    "name": "string" // New name for the folder
  }
  ```
- **Response:**
  - `200 OK` — Returns the updated folder object.
  - Example:
    ```json
    {
      "id": "uuid-string",
      "name": "Updated Documents",
      "parentId": "parent-uuid-string",
      "ownerUsername": "john.doe",
      "organizationId": "org-uuid-string",
      "createdAt": "2025-06-10T10:00:00",
      "updatedAt": "2025-06-10T11:00:00"
    }
    ```
- **Errors:**
  - `400 Bad Request` — Invalid name.
  - `401 Unauthorized` — Not authenticated.
  - `403 Forbidden` — User does not have permission to update the folder.
  - `404 Not Found` — Folder not found.
  - `409 Conflict` — A folder with the same name already exists in the same parent location.

---

## Delete Folder
- **URL:** `/api/folders/{folderId}`
- **Method:** `DELETE`
- **Auth:** User (owner or with appropriate permissions)
- **Query Params:**
  - `force`: boolean (optional, default: `false`) - If `true`, deletes the folder even if it contains files/subfolders. If `false` (default), the folder must be empty to be deleted.
- **Response:**
  - `204 No Content` — Folder deleted successfully.
- **Errors:**
  - `400 Bad Request` — Folder is not empty and `force` is `false`.
  - `401 Unauthorized` — Not authenticated.
  - `403 Forbidden` — User does not have permission to delete the folder.
  - `404 Not Found` — Folder not found.

---

## Move Folder
- **URL:** `/api/folders/{folderId}/move`
- **Method:** `POST`
- **Auth:** User (owner or with appropriate permissions)
- **Request Body:**
  ```json
  {
    "parentId": "string" // ID of the new parent folder. Use null or omit to move to root.
  }
  ```
- **Response:**
  - `200 OK` — Returns the updated folder object with its new `parentId`.
  - Example:
    ```json
    {
      "id": "uuid-string",
      "name": "Documents",
      "parentId": "new-parent-uuid-string",
      "ownerUsername": "john.doe",
      "organizationId": "org-uuid-string",
      "createdAt": "2025-06-10T10:00:00",
      "updatedAt": "2025-06-10T11:30:00"
    }
    ```
- **Errors:**
  - `400 Bad Request` — Invalid `parentId`, or trying to move a folder into itself or one of its children.
  - `401 Unauthorized` — Not authenticated.
  - `403 Forbidden` — User does not have permission.
  - `404 Not Found` — `folderId` or `parentId` not found.
  - `409 Conflict` — A folder with the same name already exists in the target location.

---

## Notes
- Folder operations should be atomic.
- Permissions for accessing and modifying folders will depend on ownership and potentially a future sharing model for folders.
- When a folder is deleted with `force=true`, all its contents (files and subfolders) should also be deleted. This can be a complex operation and should be handled carefully.
- Folders are associated with specific users and organizations to ensure proper access control.
- Moving a folder may update the organization context for the folder and all its contents if moved to a location with a different organization.
