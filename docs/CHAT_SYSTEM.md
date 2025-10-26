# Chat & Group Messaging Overview

This guide documents the chat subsystem that powers one-to-one and group conversations inside the School Management System.

## Key Capabilities

- **Direct & group chats**: `Chat.isGroup` differentiates private threads from multi-user rooms, with optional group names for display.
- **Real-time delivery**: Socket.IO broadcasts message, typing, and read receipt events via the shared `SocketContext` provider.
- **Rich messages**: Users can send text, uploads (images, video, audio, general files), voice notes, and replies to specific messages.
- **Read state & counts**: `MessageReadReceipt` rows capture who has seen a message; chat list unread badges derive from unread messages sent by others.
- **Typing indicators**: Clients emit `typing-start` / `typing-stop` socket events, surfaced in the UI as “someone is typing…”.
- **Cross-system notifications**: Every chat message generates a notification so recipients get alerts even outside the chat screen.

## Data Model (Prisma)

Defined in `prisma/schema.prisma`:

- `Chat`: top-level conversation record (`isGroup`, `name`, cached `lastMessage` / `lastMessageAt`).
- `ChatParticipant`: membership join table with `lastReadAt`, `isActive`, and a unique constraint on `(chatId, userId)`.
- `Message`: payload row with `MessageType` enum (`TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `VOICE_NOTE`), optional `replyTo` linkage, and metadata for edits.
- `MessageAttachment`: stores uploaded files for non-text messages (URL, MIME type, optional thumbnails/duration).
- `MessageReadReceipt`: per-user read tracking, inserted whenever a participant loads chat history.

## API Surface

All endpoints verify JWTs via `verifyToken` and use Prisma for persistence.

- `GET /api/chats` → Returns conversations for the authenticated user with participants, the most recent message, and an `_count.messages` unread badge (messages sent by others without a read receipt).
- `POST /api/chats` → Creates a new conversation. For direct chats it reuses an existing thread when possible; for multiple participants it sets `isGroup` and optional `name`.
- `GET /api/chats/:chatId` → Paginates messages (`page`, `limit`), includes attachments, replies, read receipts, and marks fetched foreign messages as read (creates `MessageReadReceipt`, updates `ChatParticipant.lastReadAt`).
- `POST /api/messages` → Persists a message (with optional `replyToId` and uploaded attachments), updates the parent chat’s `lastMessage` cache, and triggers the notification workflow described below.
- Supporting endpoints:
  - `POST /api/upload` handles file uploads before sending messages.
  - `GET /api/users/all` powers the participant picker in the UI.

## Socket Workflow

Real-time behavior is orchestrated through `server.js` and `contexts/SocketContext.tsx`.

- On connection, the socket authenticates via JWT and stores the user’s socket in `userSockets` for targeted emits.
- Core events handled:
  - `join-chat` / `leave-chat` → subscribe to `chat:<id>` rooms for message fan-out.
  - `message-sent` → broadcast `new-message` to room members and echo `message-confirmed` back to the sender.
  - `message-read` → emit `message-read-update` so other participants know a message was seen.
  - `typing-start` / `typing-stop` → emit `user-typing` and `user-stop-typing` events.
  - `user-online` → broadcast presence updates (used by other modules).
- The browser `SocketContext` exposes these events through hooks (`joinChat`, `sendMessage`, `markMessageAsRead`, `onNewMessage`, etc.), and the chat page subscribes to stateful callbacks for new messages, confirmations, typing, and status changes.

## Notification Integration

When a message is created (`POST /api/messages`):

1. The API fetches the chat & sender, builds a `ChatMessageNotification` via `NotificationService.createChatMessageNotification`.
2. It sets `targetUsers` to all other participants, calls `saveNotification` to persist rows in `Notification` / `UserNotification`.
3. `global.socketNotifications.broadcastNotification` pushes the alert to each participant’s notification rooms and nudges their unread counters.

This reuse of the notification service keeps chat alerts consistent with the broader notification center.

## Client Implementation

`app/chat/page.tsx` orchestrates the UX:

- Loads the chat list (`GET /api/chats`), manages selection state, joins/leaves socket rooms, and paginates messages (`GET /api/chats/:id`).
- Stores typing and reply state, triggers message sends (API + socket), and scrolls to the latest message.
- On mobile it swaps between a drawer-based chat list and the active conversation.

Supporting components:

- `components/chat/ChatList.tsx` renders conversations with avatars, unread chips, and last message previews.
- `components/chat/MessageBubble.tsx` shows individual messages, attachments, reply banners, timestamps, and menu actions (reply/edit/delete UI hooks; edit/delete endpoints are not yet wired).
- `components/chat/MessageInput.tsx` handles text entry, attachment uploads, voice-note recording, reply cancellation, and typing callbacks.
- `components/chat/UserSelector.tsx` fetches users, lets the author pick participants, and invokes `POST /api/chats` for direct or group threads.

## Typical Flows

### Starting a Conversation

1. User opens the **New Chat** dialog (`UserSelector`), searches for participants via `/api/users/all`.
2. Selecting one participant creates/reuses a direct chat; multiple selections toggle group mode and allow naming.
3. Upon `POST /api/chats` success the UI refreshes the list and focuses the new thread.

### Loading & Reading Messages

1. Selecting a chat fetches history (`GET /api/chats/:id` with `page=1`).
2. The API marks foreign messages as read through `MessageReadReceipt` rows, so unread badges shrink on next `/api/chats` refresh.
3. Additional history pages are loaded in reverse chronological order and prepended to the message list.

### Sending Messages

1. `MessageInput` optionally uploads files (`POST /api/upload`), then the chat page posts the message to `/api/messages`.
2. The API stores attachments, updates `Chat.lastMessage`, and enqueues notification delivery.
3. The UI appends the returned message immediately and also emits `message-sent` via sockets for real-time delivery.

### Group Features

- Group chats (`Chat.isGroup=true`) store an optional `name`; the UI defaults to a participant list display if the name is blank.
- All participants join the same socket room, so messages, typing indicators, and read receipts propagate to everyone.
- There are currently no endpoints for renaming groups or managing membership after creation.

## Current Gaps & Opportunities

- **Edit/Delete actions**: UI hooks exist in `MessageBubble`, but server routes for editing or deleting messages are not yet implemented.
- **Unread counter accuracy**: `_count.messages` uses an aggregate filter on unread messages; consider deriving counts from `MessageReadReceipt` to avoid edge cases (e.g., historical deletions).
- **Group management**: Lacks APIs for adding/removing participants or transferring ownership.
- **Media processing**: Uploaded files are stored with raw URLs; add validations, virus scanning, or thumbnail generation as needed.
- **Presence UX**: Socket events broadcast online/offline, but the chat UI does not presently surface that status.

This document should help orient new contributors and highlight where to extend the chat system next.
