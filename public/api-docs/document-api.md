# DocumentController API Documentation

Base URL: `/api/documents`

---

## Create Document

- **URL:** `/api/documents`
- **Method:** `POST`
- **Auth:** Required
- **Request Body:** _none_
- **Response:**
  - `201 Created` — Returns the created document object.
  - Example:
    ```json
    {
      "id": "string",
      "content": "string",
      "ownerUsername": "string",
      "createdAt": "2025-06-08T12:00:00",
      "updatedAt": "2025-06-08T12:00:00"
    }
    ```
- **Errors:**
  - `401 Unauthorized` — If not authenticated.

---

## Get Document

- **URL:** `/api/documents/{documentId}`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — Returns the document object.
  - Example:
    ```json
    {
      "id": "string",
      "content": "string",
      "ownerUsername": "string",
      "createdAt": "2025-06-08T12:00:00",
      "updatedAt": "2025-06-08T12:00:00"
    }
    ```
- **Errors:**
  - `401 Unauthorized` — If not authenticated.
  - `404 Not Found` — If document does not exist or access denied.

---

## Get Current User Documents

- **URL:** `/api/documents/my-documents`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — List of document objects.
  - Example:
    ```json
    [
      {
        "id": "string",
        "content": "string",
        "ownerUsername": "string",
        "createdAt": "2025-06-08T12:00:00",
        "updatedAt": "2025-06-08T12:00:00"
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized`

---

## Get Document Versions

- **URL:** `/api/documents/{documentId}/versions`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — List of document version objects.
  - Example:
    ```json
    [
      {
        "version": 1,
        "content": "string",
        "updatedAt": "2025-06-08T12:00:00"
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Share Document

- **URL:** `/api/documents/{documentId}/share`
- **Method:** `POST`
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "username": "string",
    "permission": "string"
  }
  ```
- **Response:**
  - `200 OK` — Share response object.
  - Example:
    ```json
    {
      "documentId": "string",
      "sharedWith": "string",
      "permission": "string",
      "sharedAt": "2025-06-08T12:00:00"
    }
    ```
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Unshare Document

- **URL:** `/api/documents/{documentId}/share/{usernameToUnshare}`
- **Method:** `DELETE`
- **Auth:** Required
- **Response:**
  - `204 No Content`
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Get Document Shares

- **URL:** `/api/documents/{documentId}/shares`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — List of share response objects.
  - Example:
    ```json
    [
      {
        "documentId": "string",
        "sharedWith": "string",
        "permission": "string",
        "sharedAt": "2025-06-08T12:00:00"
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Get Documents Shared With Me

- **URL:** `/api/documents/shared-with-me`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — List of document objects.
  - Example:
    ```json
    [
      {
        "id": "string",
        "content": "string",
        "ownerUsername": "string",
        "createdAt": "2025-06-08T12:00:00",
        "updatedAt": "2025-06-08T12:00:00"
      }
    ]
    ```
- **Errors:**
  - `401 Unauthorized`

---

## Update Document Content

- **URL:** `/api/documents/{documentId}`
- **Method:** `PUT`
- **Auth:** Required
- **Request Body:**
  - `String` (raw text content)
- **Response:**
  - `200 OK` — Updated document object.
  - Example:
    ```json
    {
      "id": "string",
      "content": "string",
      "ownerUsername": "string",
      "createdAt": "2025-06-08T12:00:00",
      "updatedAt": "2025-06-08T12:00:00"
    }
    ```
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Export Document as Word

- **URL:** `/api/documents/{documentId}/export/word`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — Returns a `.docx` file as binary.
  - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Export Document as PDF

- **URL:** `/api/documents/{documentId}/export/pdf`
- **Method:** `GET`
- **Auth:** Required
- **Response:**
  - `200 OK` — Returns a `.pdf` file as binary.
  - `Content-Type: application/pdf`
- **Errors:**
  - `401 Unauthorized`
  - `404 Not Found`

---

## Error Codes

- `401 Unauthorized` — Authentication required or failed.
- `404 Not Found` — Resource does not exist or access denied.
- `400 Bad Request` — Invalid input or parameters.
- `500 Internal Server Error` — Unexpected server error.

---

## Notes

- All endpoints require authentication unless otherwise specified.
- For binary file responses, the `Content-Disposition` header is set for file download.
- Error responses are typically JSON with a `message` field describing the error.

