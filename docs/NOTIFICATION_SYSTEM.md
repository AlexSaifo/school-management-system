# Notification System Overview

This document describes how the notification subsystem is structured and how notifications are created, stored, and delivered across the School Management System.

## Core Concepts

- **Notification types** are defined in `types/notifications.ts` and cover announcements, events, assignments, exams, timetable updates, grade releases, attendance alerts, chat messages, and custom messages. Each type carries a strongly typed metadata payload.
- **Targeting** supports any combination of roles (`TargetRole` enum), explicit `targetUsers`, and `targetClasses` to restrict delivery to classmates. Roles include `ALL`, `STUDENTS`, `PARENTS`, `TEACHERS`, and `ADMINS`.
- **Priority** uses `NotificationPriority` (`LOW`, `NORMAL`, `HIGH`, `URGENT`) to influence UI display styling.

## Data Model (Prisma)

- `Notification` table stores the canonical notification message, metadata JSON, creator, and default targeting arrays. It is mapped at `prisma/schema.prisma`.
- `UserNotification` is the fan-out join table that records which users should see a notification plus per-user read state (`isRead`, `readAt`).
- Only chat notifications currently call `NotificationService.saveNotification`, so other channels broadcast in real time without persisting unless you add a `saveNotification` call.

## Service Layer

File: `lib/notification-service.ts`

- Provides factory helpers (`createAnnouncementNotification`, `createAssignmentNotification`, etc.) that turn domain models into `Notification` payloads.
- `getTargetUsers(notification, prisma)` resolves audience sets by expanding role filters through Prisma relations (students in classes, their parents, teachers, admins, etc.).
- `saveNotification(notification)` writes the notification record and bulk inserts `UserNotification` rows, ensuring the payload remains available for later queries.
- `createCustomNotification(request, createdBy)` accepts free-form data from admin tools while still applying defaults.

## Socket Infrastructure

- `server.js` bootstraps Socket.IO on top of Next.js, authenticates clients using JWT, and keeps room membership in sync.
- Helper methods are exported on `global.socketNotifications` so API routes can broadcast without direct socket wiring: `broadcastNotification`, `sendNotificationToUser`, and `updateUnreadCount`.
- Clients automatically join rooms named `notifications:ROLE` and `notifications:user:USER_ID`, enabling both broad role-based pushes and targeted user delivery.

## API Endpoints

- `app/api/notifications/route.ts` exposes:
  - `GET` – returns the authenticated user’s notifications via `UserNotification` joins, supports filtering by type, priority, and read state.
  - `POST` – lets admins/teachers create custom notifications. It currently broadcasts but does not persist unless you call `saveNotification`.
  - `PUT` – placeholder for marking notifications as read; it emits socket events but does not yet update the database.
- Domain-specific routes (`app/api/announcements/notify`, `assignments/notify`, `events/notify`, `exams/notify`, `timetable/notify`) each create their domain record, build a notification through the service, call `getTargetUsers`, then broadcast via sockets. Persistence must be added manually.
- `app/api/messages/route.ts` handles chat messages, creates a chat notification for all other participants, calls `saveNotification`, and pushes via sockets.

## Client Integration

- `contexts/SocketContext.tsx` maintains the browser socket connection, joins notification rooms, and exposes helpers to mark notifications as read or refresh unread counts.
- `components/hooks/useNotifications.ts` fetches REST data, subscribes to socket events, and manages local state (list, unread count, optimistic read updates).
- UI components:
  - `NotificationBell.tsx` renders the badge dropdown in the header.
  - `NotificationCenter.tsx` provides a full dashboard view with filtering, tabs, and batch actions.
  - `NotificationTester.tsx` is a developer tool for manual testing (included on the dashboard notifications page).

## Current Gaps & Next Steps

- Persist non-chat notifications by invoking `notificationService.saveNotification(...)` in the relevant API routes.
- Implement a real unread counter by querying `UserNotification` instead of emitting placeholder values in `updateUnreadCount`.
- Finish `PUT /api/notifications/[id]/read` with proper database updates and reconcile socket events with persisted state.
- Flesh out `components/NotificationCreator.tsx` if an admin UI for composing custom notifications is required.
