# AuditController API Documentation

Base URL: `/api/audit`

---

## Export All Audit Logs
- **URL:** `/api/audit/export`
- **Method:** `GET`
- **Auth:** None
- **Response:**
  - `200 OK` — Returns a CSV file of all download logs.
  - `Content-Type: text/csv`
  - Example (CSV):
    ```csv
    fileId,downloaderIp,userAgent,downloadTime,uploaderUsername,fileName,fileVersion,organizationId,downloaderUserId
    ...
    ```
- **Errors:**
  - `500 Internal Server Error` — On export failure.

---

## Export Audit Logs for a File
- **URL:** `/api/audit/export/{fileId}`
- **Method:** `GET`
- **Auth:** None
- **Response:**
  - `200 OK` — Returns a CSV file of download logs for the specified file.
  - `Content-Type: text/csv`
- **Errors:**
  - `500 Internal Server Error` — On export failure.

---

## Get My Upload Logs (Paginated)
- **URL:** `/api/audit/my-uploads/logs`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `page` (default: 0)
  - `size` (default: 10)
- **Response:**
  - `200 OK` — Page of download log DTOs.
  - Example:
    ```json
    {
      "content": [
        {
          "fileId": "string",
          "downloaderIp": "string",
          "userAgent": "string",
          "downloadTime": "2025-06-08T12:00:00",
          "uploaderUsername": "string",
          "fileName": "string",
          "fileVersion": 1,
          "organizationId": "string",
          "downloaderUserId": 123
        }
      ],
      "pageable": { ... },
      "totalElements": 1,
      "totalPages": 1,
      "last": true,
      "size": 10,
      "number": 0,
      ...
    }
    ```
- **Errors:**
  - `401 Unauthorized`

---

## Get My Upload Logs by Organization (Paginated)
- **URL:** `/api/audit/my-uploads/logs/organization/{orgId}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `page` (default: 0)
  - `size` (default: 10)
- **Response:**
  - `200 OK` — Page of download log DTOs for the organization.
- **Errors:**
  - `401 Unauthorized`

---

## Export My Upload Logs as CSV
- **URL:** `/api/audit/my-uploads/logs/export`
- **Method:** `GET`
- **Auth:** User
- **Response:**
  - `200 OK` — CSV file of user's upload logs.
- **Errors:**
  - `401 Unauthorized`
  - `500 Internal Server Error`

---

## Get My Upload Logs for a File (Paginated)
- **URL:** `/api/audit/my-uploads/logs/file/{fileId}`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `page` (default: 0)
  - `size` (default: 10)
- **Response:**
  - `200 OK` — Page of download log DTOs for the file.
- **Errors:**
  - `401 Unauthorized`

---

## Error Codes
- `401 Unauthorized` — Not authenticated.
- `500 Internal Server Error` — Export or server error.

---

## Notes
- CSV responses are returned as file downloads.
- Pagination is supported for log queries.
- All endpoints returning logs require authentication as a user.
