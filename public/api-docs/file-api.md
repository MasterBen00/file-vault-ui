# File API Documentation

Base URL: `/api/files`

## File Upload and Management

### Upload File
- **URL:** `/api/files/upload`
- **Method:** `POST`
- **Auth:** User
- **Request:**
  - Multipart form-data:
    - `file`: File (required)
    - `maxDownloads`: int (required)
    - `expiryMinutes`: int (optional) - If not provided, file will never expire
    - `password`: string (optional) - For password protection
    - `folderId`: string (optional) - ID of the folder to upload the file into. If null or not provided, uploaded to user's root.
- **Response:**
  - `200 OK` — Upload success with file info, download link, QR code.
  - Example:
    ```json
    {
      "message": "File uploaded successfully with ID: ...",
      "fileId": "string",
      "downloadLink": "string",
      "qrCodeBase64": "string"
    }
    ```
- **Errors:**
  - `400 Bad Request` — User not in organization, invalid input, or folder not found/accessible.
  - `404 Not Found` — If `folderId` is provided but folder does not exist or user has no access to it.
  - `500 Internal Server Error` — Upload failed.

### Delete File
- **URL:** `/api/files/{fileId}`
- **Method:** `DELETE`
- **Auth:** User
- **Response:**
  - `200 OK` — File deleted successfully
  - Example:
    ```json
    {
      "message": "File deleted successfully."
    }
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `403 Forbidden` — No permission to delete the file
  - `404 Not Found` — File not found
  - `500 Internal Server Error` — Deletion failed

### Get My Uploaded Files
- **URL:** `/api/files/my-uploads`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `folderId`: string (optional) - ID of the folder to list files from. If not provided, lists files in the user\'s root.
- **Response:**
  - `200 OK` — List of files uploaded by the current user (filtered by folderId if provided).
  - Example:
    ```json
    [
      {
        "id": "string",
        "originalFileName": "string",
        "fileSize": 1024,
        "uploadTime": "2025-06-08T12:00:00",
        "expiryTime": "2025-06-09T12:00:00",
        "maxDownloads": 5,
        "downloadCount": 1,
        "passwordProtected": true,
        "version": 1,
        "uploaderUsername": "username",
        "organizationId": "string",
        "organizationName": "string",
        "fileType": "DOCUMENT",
        "mimeType": "application/pdf",
        "folderId": "string" // ID of the folder this file is in, null if in root
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `500 Internal Server Error` — Failed to retrieve files

## File Download

### Download File by ID
- **URL:** `/api/files/download/{fileId}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `password`: string (optional) - Required if file is password-protected
- **Response:**
  - `200 OK` — File download (binary)
  - `Content-Disposition: attachment; filename="..."`
- **Errors:**
  - `401 Unauthorized` — Not authenticated or wrong password
  - `403 Forbidden` — No permission to download
  - `404 Not Found` — File not found
  - `410 Gone` — File expired
  - `429 Too Many Requests` — Download limit reached
  - `500 Internal Server Error` — Download failed

### Download File by Name
- **URL:** `/api/files/downloadByName/{originalFileName}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `version`: int (optional) - Specific version to download
  - `password`: string (optional) - Required if file is password-protected
- **Response:**
  - `200 OK` — File download (binary)
  - `Content-Disposition: attachment; filename="..."`
- **Errors:**
  - `400 Bad Request` — User not in organization
  - `401 Unauthorized` — Not authenticated or wrong password
  - `403 Forbidden` — No permission to download
  - `404 Not Found` — File not found
  - `410 Gone` — File expired
  - `429 Too Many Requests` — Download limit reached
  - `500 Internal Server Error` — Download failed

### Secure Download with Token
- **URL:** `/api/files/secure-download`
- **Method:** `GET`
- **Auth:** None (Token-based)
- **Query Params:**
  - `token`: string (required) - Download token
- **Response:**
  - `200 OK` — File download (binary)
  - `Content-Disposition: attachment; filename="..."`
- **Errors:**
  - `401 Unauthorized` — Invalid or expired token
  - `404 Not Found` — File not found
  - `410 Gone` — File expired
  - `429 Too Many Requests` — Download limit reached
  - `500 Internal Server Error` — Download failed

### Generate Download Token
- **URL:** `/api/files/generate-token/{fileId}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `expiryMinutes`: int (default: 5) - Token expiry in minutes
- **Response:**
  - `200 OK` — Download token
  - Example: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `403 Forbidden` — No permission to generate token
  - `404 Not Found` — File not found
  - `500 Internal Server Error` — Token generation failed

## QR Code Generation

### Download QR Code for File
- **URL:** `/api/files/download/qr/{fileId}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `baseUrl`: string (optional) - Custom base URL for download link
- **Response:**
  - `200 OK` — QR code image (PNG)
  - `Content-Disposition: attachment; filename="qr-{fileId}.png"`
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `404 Not Found` — File not found
  - `500 Internal Server Error` — QR code generation failed

### Get QR Code as Base64
- **URL:** `/api/files/download/qr/base64/{fileId}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `baseUrl`: string (optional) - Custom base URL for download link
- **Response:**
  - `200 OK` — JSON object with Base64 encoded QR code
  - Example:
    ```json
    {
      "fileId": "string",
      "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `404 Not Found` — File not found
  - `500 Internal Server Error` — QR code generation failed

## File Sharing

### Share File With Users
- **URL:** `/api/files/share`
- **Method:** `POST`
- **Auth:** User (file owner only)
- **Request:**
  - `fileId`: string (query parameter)
  - Request Body: Array of email strings
- **Response:**
  - `200 OK` — Sharing successful
  - Example:
    ```json
    {
      "shared": ["user1@example.com", "user2@example.com"],
      "alreadyShared": ["user3@example.com"],
      "notFound": ["nonexistent@example.com"]
    }
    ```
- **Errors:**
  - `400 Bad Request` — Invalid input or users not found
  - `401 Unauthorized` — Not authenticated
  - `403 Forbidden` — Not the file owner
  - `404 Not Found` — File not found
  - `500 Internal Server Error` — Operation failed

### Files Shared By Me
- **URL:** `/api/files/shared-by-me`
- **Method:** `GET`
- **Auth:** User
- **Response:**
  - `200 OK` — List of files shared by the user
  - Example:
    ```json
    [
      {
        "file": {
          "id": "string",
          "originalFileName": "string",
          "fileSize": 1024,
          "uploadTime": "2025-06-08T12:00:00",
          "expiryTime": "2025-06-09T12:00:00",
          "maxDownloads": 5,
          "downloadCount": 1,
          "passwordProtected": true,
          "version": 1,
          "uploaderUsername": "username",
          "organizationId": "string",
          "organizationName": "string",
          "fileType": "DOCUMENT",
          "mimeType": "application/pdf"
        },
        "sharedWithUsers": [
          {
            "username": "string",
            "email": "string",
            "shareDate": "2025-06-08T12:00:00"
          }
        ]
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `500 Internal Server Error` — Failed to retrieve shared files

### Files Shared With Me
- **URL:** `/api/files/shared-with-me`
- **Method:** `GET`
- **Auth:** User
- **Response:**
  - `200 OK` — List of files shared with the user
  - Example:
    ```json
    [
      {
        "file": {
          "id": "string",
          "originalFileName": "string",
          "fileSize": 1024,
          "uploadTime": "2025-06-08T12:00:00",
          "expiryTime": "2025-06-09T12:00:00",
          "maxDownloads": 5,
          "downloadCount": 1,
          "passwordProtected": true,
          "version": 1,
          "uploaderUsername": "username",
          "organizationId": "string",
          "organizationName": "string",
          "fileType": "DOCUMENT",
          "mimeType": "application/pdf"
        },
        "sharedBy": "username",
        "shareDate": "2025-06-08T12:00:00"
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `500 Internal Server Error` — Failed to retrieve shared files

### File Sharing Activity
- **URL:** `/api/files/sharing-activity`
- **Method:** `GET`
- **Auth:** User
- **Response:**
  - `200 OK` — Detailed sharing activity for files uploaded by the user
  - Example:
    ```json
    [
      {
        "file": {
          "id": "string",
          "originalFileName": "string",
          "fileSize": 1024,
          "uploadTime": "2025-06-08T12:00:00",
          "expiryTime": "2025-06-09T12:00:00",
          "maxDownloads": 5,
          "downloadCount": 1,
          "passwordProtected": true,
          "version": 1,
          "uploaderUsername": "username",
          "organizationId": "string",
          "organizationName": "string",
          "fileType": "DOCUMENT",
          "mimeType": "application/pdf"
        },
        "downloadLogs": [
          {
            "id": "string",
            "downloadTime": "2025-06-08T14:30:00",
            "downloaderIp": "192.168.1.1",
            "userAgent": "Mozilla/5.0...",
            "downloaderId": "string",
            "downloaderUsername": "username",
            "organizationId": "string"
          }
        ]
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `500 Internal Server Error` — Failed to retrieve activity data

## Activity Logs

### User Activity Feed
- **URL:** `/api/files/activity-feed`
- **Method:** `GET`
- **Auth:** User
- **Response:**
  - `200 OK` — Recent actions by the current user
  - Example:
    ```json
    [
      {
        "id": "string",
        "username": "string",
        "userId": "string",
        "actionType": "UPLOAD",
        "targetType": "FILE",
        "targetId": "string",
        "targetName": "document.pdf",
        "timestamp": "2025-06-08T12:00:00",
        "additionalInfo": "{}",
        "organizationId": "string"
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `500 Internal Server Error` — Failed to retrieve activity feed

### Admin Audit Trail
- **URL:** `/api/files/audit-trail`
- **Method:** `GET`
- **Auth:** User with ADMIN or SUPER_ADMIN role
- **Query Params:**
  - `limit`: int (default: 100) - Number of records to return
- **Response:**
  - `200 OK` — Recent actions in the organization or all actions if super admin
  - Example: *(Same format as activity-feed)*
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `403 Forbidden` — Not an admin
  - `500 Internal Server Error` — Failed to retrieve audit trail

### Filtered Activity Log
- **URL:** `/api/files/activity-log`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `username`: string (optional) - Filter by username
  - `orgId`: string (optional) - Filter by organization ID
  - `actionType`: string (optional) - Filter by action type (UPLOAD, DOWNLOAD, etc.)
  - `targetType`: string (optional) - Filter by target type (FILE, etc.)
  - `targetId`: string (optional) - Filter by target ID
  - `page`: int (default: 0) - Page number
  - `size`: int (default: 20) - Page size
- **Response:**
  - `200 OK` — Filtered and paginated activity logs
  - Example: *(Same format as activity-feed with pagination)*
- **Errors:**
  - `401 Unauthorized` — Not authenticated
  - `500 Internal Server Error` — Failed to retrieve logs

## Error Codes

- `400 Bad Request` — Invalid input or missing required data
- `401 Unauthorized` — Not authenticated or wrong password
- `403 Forbidden` — No permission
- `404 Not Found` — File not found
- `410 Gone` — File expired
- `429 Too Many Requests` — Download limit reached or rate limiter in effect
- `500 Internal Server Error` — Unexpected server error

## Notes

- All endpoints require authentication unless otherwise specified.
- File downloads are returned as binary data with appropriate headers.
- Security model is based on file ownership and sharing (not explicit permission levels).
- Expired files can be managed through the `/api/files/expired/` endpoints documented separately.
