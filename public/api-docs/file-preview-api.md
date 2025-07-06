# FilePreviewController API Documentation

Base URL: `/api/preview`

---

## File Preview
- **URL:** `/api/preview`
- **Method:** `GET`
- **Auth:** User
- **Query Params:**
  - `filePath`: string (required) — The path of the file to preview.
- **Response:**
  - `200 OK` — Returns the file content for in-browser preview.
  - Headers:
    - `Content-Type`: Based on the file type (e.g., `image/png`, `application/pdf`).
    - `Content-Disposition`: `inline`.
- **Errors:**
  - `400 Bad Request` — Invalid file path.
  - `404 Not Found` — File not found.
  - `500 Internal Server Error` — Preview failed.

---
