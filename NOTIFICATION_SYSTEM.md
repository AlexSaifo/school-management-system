# Notification Socket System Documentation

## Overview

The notification system provides real-time notifications for various school management events including announcements, events, assignments, exams, and timetable updates. It uses Socket.IO for real-time communication and supports role-based targeting.

## Architecture

### 1. Types and Interfaces (`types/notifications.ts`)
- Comprehensive TypeScript interfaces for all notification types
- Support for bilingual content (English/Arabic)
- Role-based targeting system
- Priority levels (LOW, NORMAL, HIGH, URGENT)

### 2. Socket Context (`contexts/SocketContext.tsx`)
- Extended existing socket context with notification functionality
- Automatic role-based room joining on connection
- Notification event listeners and emitters

### 3. Notification Service (`lib/notification-service.ts`)
- Factory methods for creating different notification types
- Target user resolution based on roles and classes
- Comprehensive notification creation utilities

### 4. Server Integration (`server.js`)
- Socket event handlers for notifications
- Role-based room management
- Notification broadcasting functions
- Global notification utilities for API routes

### 5. API Endpoints
- `POST /api/notifications` - Create custom notifications
- `GET /api/notifications` - Fetch user notifications
- `POST /api/announcements/notify` - Create announcement with notification
- `POST /api/events/notify` - Create event with notification
- `POST /api/assignments/notify` - Create assignment with notification
- `POST /api/exams/notify` - Create exam with notification
- `POST /api/timetable/notify` - Send timetable update notifications

### 6. UI Components
- `NotificationBell` - Dropdown notification bell for navbar
- `NotificationCenter` - Full-page notification management
- `useNotifications` - React hook for notification state management

## Usage Examples

### Creating Notifications Programmatically

```typescript
// Using the notification service directly
import { notificationService } from '@/lib/notification-service';

// Create an announcement notification
const notification = notificationService.createAnnouncementNotification(
  announcement,
  currentUser
);

// Broadcast via socket
if (global.socketNotifications) {
  global.socketNotifications.broadcastNotification(notification);
}
```

### Using API Endpoints

```javascript
// Create an announcement with automatic notification
const response = await fetch('/api/announcements/notify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: 'School Holiday Notice',
    content: 'School will be closed tomorrow due to weather conditions.',
    targetRoles: ['STUDENTS', 'PARENTS'],
    priority: 'HIGH'
  })
});
```

### Using React Components

```tsx
import { NotificationBell } from '@/components/NotificationBell';
import { useNotifications } from '@/components/hooks/useNotifications';

// In your navbar or layout
<NotificationBell maxDisplayedNotifications={10} />

// In your component
const { notifications, unreadCount, markAsRead } = useNotifications();
```

## Notification Types Supported

### 1. Announcements
- **Target Roles**: Configurable (ALL, STUDENTS, PARENTS, TEACHERS, ADMINS)
- **Auto-triggered**: When announcements are created
- **Priority**: Configurable
- **Bilingual**: Yes

### 2. Events
- **Target Roles**: Configurable based on event type
- **Auto-triggered**: When events are created
- **Metadata**: Event date, time, location
- **Bilingual**: Yes

### 3. Assignments
- **Target Roles**: STUDENTS, PARENTS (class-specific)
- **Auto-triggered**: When assignments are created
- **Metadata**: Due date, subject, class, marks
- **Submission Notifications**: To teachers when students submit

### 4. Exams
- **Target Roles**: STUDENTS, PARENTS (class-specific)
- **Auto-triggered**: When exams are scheduled
- **Metadata**: Exam date, duration, subject, class
- **Grade Notifications**: When results are published

### 5. Timetable Updates
- **Target Roles**: STUDENTS, PARENTS, TEACHERS (class-specific)
- **Types**: Schedule changes, teacher changes, location changes
- **Bulk Updates**: Support for multiple classes
- **Metadata**: What changed, affected dates/time slots

### 6. Attendance Alerts
- **Target Roles**: PARENTS, TEACHERS
- **Types**: Absent, Late, Low attendance rate
- **Student-specific**: Targeted to parents of specific students

## Role-Based Targeting

The system automatically targets notifications based on roles:

- **ALL**: Everyone in the system
- **STUDENTS**: All students or specific classes
- **PARENTS**: All parents or parents of students in specific classes
- **TEACHERS**: All teachers or teachers of specific classes
- **ADMINS**: All administrators

## Socket Rooms

The system uses the following room naming convention:
- `notifications:ALL` - All users
- `notifications:STUDENTS` - All students
- `notifications:PARENTS` - All parents
- `notifications:TEACHERS` - All teachers
- `notifications:ADMINS` - All admins
- `notifications:user:${userId}` - Specific user
- `notifications:class:${classId}` - Specific class (future feature)

## Browser Notifications

The system automatically requests browser notification permission and shows native notifications when:
- User has granted permission
- User receives a new notification
- Browser tab is not active

## Internationalization

All notifications support Arabic and English:
- Title and message fields have both `title`/`titleAr` and `message`/`messageAr`
- UI components automatically display the appropriate language
- Date/time formatting respects user's language preference

## Database Integration

Currently, the system works with in-memory notifications via Socket.IO. For production, you should:

1. Create a `notifications` table in your database
2. Store notifications persistently
3. Implement read receipts tracking
4. Add notification preferences per user

## Security

- JWT token authentication for socket connections
- Role-based access control for creating notifications
- User-specific targeting ensures privacy

## Performance Considerations

- Notifications are broadcast to rooms, not individual users (efficient)
- Browser notifications are throttled to prevent spam
- Socket connections are managed automatically
- Notification history is limited to prevent memory issues

## Testing

To test the notification system:

1. Start the development server: `npm run dev`
2. Log in with different user roles
3. Create announcements, events, assignments, or exams
4. Observe real-time notifications in the notification bell
5. Test with multiple browser windows/tabs for different users

## Integration with Existing CRUD Operations

The system provides separate `/notify` endpoints that can be used alongside or instead of existing CRUD operations. You can:

1. Use the notify endpoints directly for new features
2. Call the notify endpoints after successful CRUD operations
3. Integrate notification creation into existing API routes

This allows for gradual adoption without breaking existing functionality.