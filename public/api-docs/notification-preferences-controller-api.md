# Notification Preferences Controller API Documentation

## Overview
The Notification Preferences Controller manages user preferences for notifications, including toggling email notifications for specific actions.

## Endpoints

### `/api/notifications/preferences`
**Method:** GET  
**Description:** Retrieves the notification preferences for a user.  
**Query Parameters:**
- `username` (required): The username of the user.

**Response:**
```json
{
  "emailNotificationsEnabled": true,
  "webSocketNotificationsEnabled": true,
  "notifyOnFileDownload": true,
  "notifyOnFileUpload": true,
  "notifyOnFileExpiry": true
}
```

### `/api/notifications/preferences`
**Method:** PUT  
**Description:** Updates the notification preferences for a user.  
**Query Parameters:**
- `username` (required): The username of the user.

**Request Body:**
```json
{
  "emailNotificationsEnabled": true,
  "webSocketNotificationsEnabled": true,
  "notifyOnFileDownload": true,
  "notifyOnFileUpload": true,
  "notifyOnFileExpiry": true
}
```
**Response:**
- 200 OK: Preferences updated successfully.

### `/api/notifications/preferences/actions`
**Method:** GET  
**Description:** Retrieves action-specific notification preferences for a user.  
**Query Parameters:**
- `username` (required): The username of the user.

**Response:**
```json
{
  "notifyOnFileDownload": true,
  "notifyOnFileUpload": true,
  "notifyOnFileExpiry": true
}
```

### `/api/notifications/preferences/actions`
**Method:** PUT  
**Description:** Updates action-specific notification preferences for a user.  
**Query Parameters:**
- `username` (required): The username of the user.

**Request Body:**
```json
{
  "notifyOnFileDownload": true,
  "notifyOnFileUpload": true,
  "notifyOnFileExpiry": true
}
```
**Response:**
- 200 OK: Preferences updated successfully.

## Notes
- Ensure the user exists before updating preferences.
- Preferences are stored in the `NotificationPreferences` entity.
