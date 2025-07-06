# Password-Protected Files API

This API allows users to manage and access password-protected files.

---

## Endpoints

### 1. Get My Password-Protected Uploads
- **GET** `/api/protected-files/my-uploads`
- **Query Params:** `page` (default: 0), `size` (default: 10)
- **Auth:** User
- **Response:**
  - `200 OK` — Paginated list of files uploaded by the current user.
  - Example:
    ```json
    {
      "content": [
        {
          "fileId": "string",
          "fileName": "string",
          "uploadedAt": "2025-06-08T12:00:00",
          "organizationId": "string"
        }
      ],
      "totalElements": 1,
      "totalPages": 1,
      "size": 10,
      "number": 0
    }
    ```

---

### 2. Get My Password-Protected Uploads by Organization
- **GET** `/api/protected-files/my-uploads/organization/{orgId}`
- **Path Param:** `orgId`
- **Query Params:** `page` (default: 0), `size` (default: 10)
- **Auth:** User
- **Response:**
  - `200 OK` — Paginated list of files uploaded by the user in the specified organization.
  - Example: _Same as above_

---

### 3. Get Password-Protected Files Shared With Me
- **GET** `/api/protected-files/shared-with-me`
- **Query Params:** `page` (default: 0), `size` (default: 10)
- **Auth:** User
- **Response:**
  - `200 OK` — Paginated list of files shared with the current user.
  - Example: _Same as above_

---

### 4. Verify Password for a Protected File
- **POST** `/api/protected-files/{fileId}/verify-password`
- **Path Param:** `fileId`
- **Body:**
  ```json
  { "password": "string" }
  ```
- **Auth:** User
- **Response:**
  - `200 OK` — Password verification result.
  - Example:
    ```json
    { "success": true, "message": "Password verified successfully" }
    ```
- **Errors:**
  - `403 Forbidden` — No access to file.
  - `400 Bad Request` — Password missing.

---

### 5. Update Password for a Protected File
- **PUT** `/api/protected-files/{fileId}/update-password`
- **Path Param:** `fileId`
- **Body:**
  ```json
  { "oldPassword": "string", "newPassword": "string" }
  ```
- **Auth:** User
- **Response:**
  - `200 OK` — Password update result.
  - Example:
    ```json
    { "success": true, "message": "Password updated successfully" }
    ```
- **Errors:**
  - `400 Bad Request` — Missing old or new password.
  - `403 Forbidden` — Incorrect current password.

---

## Notes
- All endpoints require authentication as a user.
- Pagination is supported for all list endpoints.
- Password verification and update endpoints return a success flag and message.
