# AuthController API Documentation

Base URL: `/api/auth`

---

## Login
- **URL:** `/api/auth/login` or `/api/auth/signin`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "usernameOrEmail": "string",
    "password": "string"
  }
  ```
- **Response:**
  - `200 OK` — Returns JWT token.
  - Example:
    ```json
    { "token": "jwt-token-string" }
    ```
- **Errors:**
  - `401 Unauthorized` — Invalid credentials.

---

## Register
- **URL:** `/api/auth/register` or `/api/auth/signup`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  - `201 Created` — Registration success message.
  - Example:
    ```json
    { "message": "Registration successful. Please verify your email." }
    ```
- **Errors:**
  - `400 Bad Request` — Validation or registration error.

---

## Verify Email
- **URL:** `/api/auth/verify-email?token=...`
- **Method:** `GET`
- **Response:**
  - `200 OK` — Verification result message.
  - Example:
    ```json
    { "message": "Email verified successfully." }
    ```
- **Errors:**
  - `400 Bad Request` — Invalid or expired token.

---

## Logout
- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Auth:** User
- **Response:**
  - `200 OK` — Logout success message.
  - Example:
    ```json
    { "message": "Logged out successfully." }
    ```
- **Errors:**
  - `401 Unauthorized` — Not authenticated.

---

## Notes
- All endpoints return JSON responses.
- Registration and login return a token or message.
- Logout and verify email return a message.
