# Notification Controller API Documentation

## Overview
The Notification Controller handles real-time notifications for users. It integrates with WebSocket to send updates to clients.

## Endpoints

### `/api/notifications/send`
**Method:** POST  
**Description:** Sends a notification to a specific user or group of users.  
**Request Body:**
```json
{
  "recipient": "username or group",
  "message": "Notification message"
}
```
**Response:**
- 200 OK: Notification sent successfully.
- 400 Bad Request: Invalid input.

## Notes
- Ensure WebSocket is configured and running for real-time notifications.
- Notifications are sent to the `/topic/notifications` WebSocket topic.
