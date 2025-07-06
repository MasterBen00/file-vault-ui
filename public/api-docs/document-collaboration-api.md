# Document Collaboration WebSocket API

This document describes the WebSocket endpoints for real-time document collaboration, as implemented in `DocumentSocketController`.

---

## WebSocket Endpoints

All endpoints use STOMP over WebSocket. The client should connect to the WebSocket endpoint (e.g., `/ws`) and subscribe/send messages as described below.

### 1. Real-time Document Content Update
- **Send to:** `/app/docs/{documentId}/update`
- **Payload:**
  ```json
  {
    "content": "string",
    "updatedBy": "string"
  }
  ```
- **Broadcast to:** `/topic/docs/{documentId}`
- **Description:**
  - Send updated document content. All subscribers receive the update.

---

### 2. Typing Status Notification
- **Send to:** `/app/docs/{documentId}/typing`
- **Payload:**
  ```json
  {
    "username": "string",
    "typing": true
  }
  ```
- **Broadcast to:** `/topic/docs/{documentId}/typing`
- **Description:**
  - Notify others when a user is typing.

---

### 3. Presence (Join/Leave)
- **Send to:** `/app/docs/{documentId}/presence/join` (no payload)
- **Send to:** `/app/docs/{documentId}/presence/leave` (no payload)
- **Broadcast to:** `/topic/docs/{documentId}/presence`
- **Payload:**
  ```json
  ["username1", "username2", ...]
  ```
- **Description:**
  - Track and broadcast the list of users present in the document.

---

### 4. Cursor Position Sharing
- **Send to:** `/app/docs/{documentId}/cursor`
- **Payload:**
  ```json
  {
    "username": "string",
    "cursor": { /* position info */ }
  }
  ```
- **Broadcast to:** `/topic/docs/{documentId}/cursors`
- **Payload:**
  ```json
  {
    "username1": "{...}",
    "username2": "{...}"
  }
  ```
- **Description:**
  - Share and broadcast cursor positions of all users.

- **Send to:** `/app/docs/{documentId}/cursor/leave` (no payload)
  - Removes the user's cursor from the shared state.

---

### 5. Scroll Synchronization
- **Send to:** `/app/docs/{documentId}/scroll`
- **Payload:**
  ```json
  {
    "username": "string",
    "scroll": { /* scroll info */ }
  }
  ```
- **Broadcast to:** `/topic/docs/{documentId}/scrolls`
- **Payload:**
  ```json
  {
    "username1": "{...}",
    "username2": "{...}"
  }
  ```
- **Description:**
  - Share and broadcast scroll positions of all users.

---

## Notes
- All endpoints require an authenticated WebSocket session.
- Subscribe to the relevant `/topic/...` destinations to receive real-time updates.
- Payloads are JSON objects unless otherwise specified.
- The server manages presence, cursor, and scroll state per document.

