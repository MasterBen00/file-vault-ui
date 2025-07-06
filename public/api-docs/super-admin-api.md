# Super Admin API

This API provides endpoints for super admin users to manage users, organizations, roles, system settings, and audit logs.

---

## User Management
- **GET** `/api/superadmin/users` — List users (filter by username, email, org, role, isActive)
  - **Response:**
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
- **GET** `/api/superadmin/users/{userId}` — Get user by ID
  - **Response:** _Same as above, single object_
- **PUT** `/api/superadmin/users/{userId}` — Update user
  - **Request Body:**
    ```json
    { "email": "string", "isActive": true }
    ```
  - **Response:** _Same as above, single object_
- **DELETE** `/api/superadmin/users/{userId}` — Delete user
  - **Response:** `204 No Content`
- **PUT** `/api/superadmin/users/{userId}/enable` — Enable user
  - **Response:** _Same as above, single object_
- **PUT** `/api/superadmin/users/{userId}/disable` — Disable user
  - **Response:** _Same as above, single object_
- **POST** `/api/superadmin/users/{userId}/force-logout` — Force logout
  - **Response:** `204 No Content`
- **POST** `/api/superadmin/users/{userId}/reset-password` — Reset password
  - **Request Body:**
    ```json
    { "newPassword": "string" }
    ```
  - **Response:** `204 No Content`
- **PUT** `/api/superadmin/users/{userId}/assign-organization/{organizationId}` — Assign org
  - **Response:** _Same as above, single object_
- **PUT** `/api/superadmin/users/{userId}/assign-role/{roleName}` — Assign role
  - **Response:** _Same as above, single object_
- **PUT** `/api/superadmin/users/{userId}/remove-role/{roleName}` — Remove role
  - **Response:** _Same as above, single object_
- **PUT** `/api/superadmin/users/{userId}/make-admin` — Make user admin
  - **Response:** _Same as above, single object_
- **GET** `/api/superadmin/users/{userId}/max-storage` — Get a user's max storage (in MB)
  - **Response:**
    ```json
    { "userId": 1, "username": "string", "maxStorageMb": 100 }
    ```
- **PUT** `/api/superadmin/users/{userId}/max-storage?maxStorageMb=100` — Set a user's max storage (in MB)
  - **Response:**
    ```json
    { "userId": 1, "username": "string", "maxStorageMb": 100 }
    ```

## Bulk User Operations
- **POST** `/api/superadmin/users/bulk-assign-organization`
  - **Request Body:**
    ```json
    { "userIds": [1,2], "organizationId": "string" }
    ```
  - **Response:** _List of user objects as above_
- **POST** `/api/superadmin/users/bulk-assign-role`
  - **Request Body:**
    ```json
    { "userIds": [1,2], "roleName": "ADMIN" }
    ```
  - **Response:** _List of user objects as above_
- **POST** `/api/superadmin/users/bulk-remove-role`
  - **Request Body:**
    ```json
    { "userIds": [1,2], "roleName": "USER" }
    ```
  - **Response:** _List of user objects as above_
- **POST** `/api/superadmin/users/bulk-enable`
  - **Request Body:**
    ```json
    { "userIds": [1,2] }
    ```
  - **Response:** _List of user objects as above_
- **POST** `/api/superadmin/users/bulk-disable`
  - **Request Body:**
    ```json
    { "userIds": [1,2] }
    ```
  - **Response:** _List of user objects as above_
- **POST** `/api/superadmin/users/bulk-delete`
  - **Request Body:**
    ```json
    { "userIds": [1,2] }
    ```
  - **Response:** `204 No Content`

## Audit Logs
- **GET** `/api/superadmin/audit-logs` — Filterable by admin, action, entity, date
  - **Response:**
    ```json
    [
      {
        "id": 1,
        "adminUsername": "string",
        "actionType": "string",
        "targetEntityType": "string",
        "targetEntityId": "string",
        "timestamp": "2025-06-08T12:00:00"
      }
    ]
    ```

## System Settings
- **GET** `/api/superadmin/settings`
  - **Response:**
    ```json
    [
      { "key": "string", "value": "string", "description": "string" }
    ]
    ```
- **GET** `/api/superadmin/settings/{key}`
  - **Response:**
    ```json
    { "key": "string", "value": "string", "description": "string" }
    ```
- **PUT** `/api/superadmin/settings`
  - **Request Body:**
    ```json
    { "key": "string", "value": "string", "description": "string" }
    ```
  - **Response:** _Same as above, single object_

## Role Management
- **POST** `/api/superadmin/roles`
  - **Request Body:**
    ```json
    { "name": "string", "description": "string" }
    ```
  - **Response:**
    ```json
    { "name": "string", "description": "string" }
    ```
- **GET** `/api/superadmin/roles`
  - **Response:**
    ```json
    [ { "name": "string", "description": "string" } ]
    ```
- **DELETE** `/api/superadmin/roles/{roleName}`
  - **Response:** `204 No Content`

## Organization Management
- **POST** `/api/superadmin/organizations`
  - **Request Body:**
    ```json
    { "name": "string", "description": "string" }
    ```
  - **Response:**
    ```json
    { "id": "string", "name": "string", "description": "string" }
    ```
- **GET** `/api/superadmin/organizations`
  - **Response:**
    ```json
    [ { "id": "string", "name": "string", "description": "string" } ]
    ```
- **GET** `/api/superadmin/organizations/{organizationId}`
  - **Response:**
    ```json
    { "id": "string", "name": "string", "description": "string" }
    ```
- **DELETE** `/api/superadmin/organizations/{organizationId}`
  - **Response:** `204 No Content`
- **GET** `/api/superadmin/organizations/{organizationId}/users`
  - **Response:** _List of user objects as above_

---

## Notes
- All endpoints require authentication as a super admin.
- Bulk operations accept lists of user IDs or role/organization info as JSON bodies.
- System settings and audit logs are only accessible to super admins.
