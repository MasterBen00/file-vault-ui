# Search API

This API provides endpoints for searching and indexing file content using Elasticsearch.

---

## Endpoints

### 1. Upload and Index File
- **POST** `/api/search/upload`
- **Form Data:** `file` (multipart file)
- **Response:**
  - `200 OK`: File indexed successfully with ID
    ```json
    { "message": "File indexed successfully with ID: ..." }
    ```
  - `400 Bad Request`: File is empty or missing
    ```json
    { "message": "File is empty or missing." }
    ```
  - `500 Internal Server Error`: Indexing failed
    ```json
    { "message": "Failed to index file content." }
    ```
- **Description:**
  - Uploads a file and indexes its content into Elasticsearch for later search.

---

### 2. Simple Search Query
- **GET** `/api/search/query`
- **Query Param:** `query` (string, required)
- **Response:**
  - `200 OK`: List of matching documents (content and filename fields)
    ```json
    [
      {
        "content": "...",
        "filename": "...",
        "otherField": "..."
      }
    ]
    ```
  - `500 Internal Server Error`: Search failed
    ```json
    null
    ```
- **Description:**
  - Searches indexed content and filenames for the given query string.

---

### 3. Advanced Search Query
- **GET** `/api/search/advanced-query`
- **Query Params:**
  - `query` (string, required)
  - `fileType` (string, optional)
  - `from` (int, default: 0)
  - `size` (int, default: 10)
- **Response:**
  - `200 OK`: JSON object with `total`, `results` (list of sources and highlights), `from`, and `size`
    ```json
    {
      "total": 1,
      "results": [
        {
          "source": { "content": "...", "fileName": "..." },
          "highlights": { "content": ["..."] }
        }
      ],
      "from": 0,
      "size": 10
    }
    ```
  - `500 Internal Server Error`: Search failed
    ```json
    { "error": "..." }
    ```
- **Description:**
  - Supports pagination, file type filtering, highlighting, and multi-field fuzzy search (content, fileName, metadata).

---

## Notes
- All endpoints are public unless protected by additional security configuration.
- File uploads must be sent as multipart/form-data.
- Advanced search returns highlights for matched fields.
- Elasticsearch must be running and accessible for these endpoints to function.
