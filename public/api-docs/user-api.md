# User API

This API provides endpoints for authenticated users to retrieve their own user information, roles, storage usage information, and (for admins) all users.

---

## Endpoints

### 1. Get Current User Info
- **GET** `/api/user/me`
- **Auth:** Any authenticated user
- **Response:**
  - `200 OK` — UserInfoDto (id, username, email, roles, isActive, organization info)
  - Example:
    ```json
    {
      "id": 1,
      "username": "string",
      "email": "string",
      "roles": ["USER", "ADMIN"],
      "isActive": true,
      "organizationId": "string",
      "organizationName": "string"
    }
    ```

---

### 2. Get User Info (ROLE_USER)
- **GET** `/api/user/user`
- **Auth:** ROLE_USER
- **Response:**
  - `200 OK` — UserInfoDto for the current user
  - Example: _Same as above_

---

### 3. Get All Users Info (ROLE_ADMIN)
- **GET** `/api/user/admin`
- **Auth:** ROLE_ADMIN
- **Response:**
  - `200 OK` — List of UserInfoDto for all users
  - Example:
    ```json
    [
      {
        "id": 1,
        "username": "string",
        "email": "string",
        "roles": ["USER", "ADMIN"],
        "isActive": true,
        "organizationId": "string",
        "organizationName": "string"
      }
    ]
    ```

---

### 4. Get Info for All Authenticated (USER or ADMIN)
- **GET** `/api/user/all-roles`
- **Auth:** ROLE_USER or ROLE_ADMIN
- **Response:**
  - `200 OK` — UserInfoDto for the current user
  - Example: _Same as above_

---

### 5. Get Current User Roles
- **GET** `/api/user/my-roles`
- **Auth:** Any authenticated user
- **Response:**
  - `200 OK` — Set of role names for the current user
  - Example:
    ```json
    ["USER", "ADMIN"]
    ```

---

### 6. Get User Storage Information
- **GET** `/api/user/storage-info`
- **Auth:** Any authenticated user
- **Response:**
  - `200 OK` — UserStorageInfoDto with storage usage data
  - Example:
    ```json
    {
      "username": "string",
      "maxStorageMb": 500,
      "maxStorageBytes": 524288000,
      "usageBytes": 125000000,
      "usageMegaBytes": "119.21"
    }
    ```
  - `400 Bad Request` — If user not found 
    ```json
    "User not found"
    ```

---

## Notes
- All endpoints require authentication.
- UserInfoDto includes user id, username, email, roles, active status, and organization info.
- UserStorageInfoDto includes username, maximum storage size in MB and bytes, current usage in bytes, and current usage formatted as megabytes.
- Some endpoints are restricted to specific roles as noted above.
