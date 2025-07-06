# RateLimitController API Documentation

Base URL: `/api/rate-limit`

---

## Rate Limit Check
- **URL:** `/api/rate-limit/check`
- **Method:** `GET`
- **Auth:** None
- **Query Params:**
  - `context`: string (optional, default: `global`) — The rate-limiting context to check.
- **Response:**
  - `200 OK` — Rate limit status.
  - Headers:
    - `X-RateLimit-Limit`: Total allowed requests.
    - `X-RateLimit-Remaining`: Remaining requests in the current window.
    - `X-RateLimit-Reset`: Time (in seconds) until the limit resets.
  - Example:
    ```json
    {
      "message": "Request allowed."
    }
    ```
  - `429 Too Many Requests` — Rate limit exceeded.
  - Headers:
    - `Retry-After`: Time (in seconds) until the client can retry.
  - Example:
    ```json
    {
      "message": "Rate limit exceeded. Please try again later."
    }
    ```
- **Errors:**
  - `400 Bad Request` — Invalid context.
  - `500 Internal Server Error` — Rate limit check failed.

---
