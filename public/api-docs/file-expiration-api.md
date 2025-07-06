# FileExpirationController API Documentation

Base URL: `/api/file-expiration`

---

## Get Expired Files
- **URL:** `/api/file-expiration/expired`
- **Method:** `GET`
- **Auth:** Admin/User (depending on implementation)
- **Response:**
  - `200 OK` — List of expired file metadata objects.
- **Errors:**
  - `401 Unauthorized`
  - `403 Forbidden`

---

## Delete Expired Files
- **URL:** `/api/file-expiration/delete-expired`
- **Method:** `DELETE`
- **Auth:** Admin
- **Response:**
  - `200 OK` — Success message or list of deleted files.
- **Errors:**
  - `401 Unauthorized`
  - `403 Forbidden`
  - `500 Internal Server Error`

---

## Error Codes
- `401 Unauthorized` — Not authenticated.
- `403 Forbidden` — No permission.
- `500 Internal Server Error` — Unexpected error.

---

## Notes
- Endpoints may require admin or user authentication depending on your security configuration.
- Deleting expired files is typically restricted to admins.
- Expired files are determined by their expiration date or download limit.

