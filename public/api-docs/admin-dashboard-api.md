# DashboardController API Documentation

Base URL: `/api/admin/dashboard`

---

## Get Dashboard Stats
- **URL:** `/api/admin/dashboard/stats`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — Returns dashboard statistics.
  - Example:
    ```json
    {
      "totalFiles": 100,
      "activeFiles": 80,
      "expiredFiles": 20,
      "totalDownloads": 500,
      "downloadsInLast24Hrs": 30
    }
    ```

---

## Get Top Downloaded Files
- **URL:** `/api/admin/dashboard/top-downloaded`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — List of top downloaded files.

---

## Get Recent Downloads
- **URL:** `/api/admin/dashboard/recent-downloads`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — List of recent downloads.

---

## Get Storage Used
- **URL:** `/api/admin/dashboard/storage-used`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — Total storage used.

---

## Get Storage by Uploader
- **URL:** `/api/admin/dashboard/storage-by-uploader`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — List of storage used by each uploader.

---

## Get Download Trend
- **URL:** `/api/admin/dashboard/download-trend`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — Download trend data for the last 7 days.

---

## Get Files Expiring Soon
- **URL:** `/api/admin/dashboard/files-expiring-soon?days={days}`
- **Method:** `GET`
- **Auth:** Admin
- **Query Params:**
  - `days` (default: 7)
- **Response:**
  - `200 OK` — List of files expiring in the next N days.

---

## Get Files at Max Downloads
- **URL:** `/api/admin/dashboard/files-max-downloads`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — List of files that have reached their max download limit.

---

## Get Password-Protected File Stats
- **URL:** `/api/admin/dashboard/password-protected-stats`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — Statistics about password-protected files.

---

## Get Files with Redownload Requests
- **URL:** `/api/admin/dashboard/redownload-requests`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — List of files with pending redownload requests.

---

## Get User Stats
- **URL:** `/api/admin/dashboard/user-stats`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — User statistics.

---

## Get Organization Stats
- **URL:** `/api/admin/dashboard/organization-stats`
- **Method:** `GET`
- **Auth:** Admin
- **Response:**
  - `200 OK` — Organization statistics.

---

## Error Codes
- `401 Unauthorized` — Not authenticated.
- `403 Forbidden` — Not an admin.
- `500 Internal Server Error` — Unexpected error.

---

## Notes
- All endpoints require admin authentication.
- Responses are typically JSON objects or arrays.

