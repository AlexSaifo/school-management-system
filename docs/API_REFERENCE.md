# API Reference

## Overview

The School Management System provides a comprehensive REST API built with Next.js API routes. All endpoints return JSON responses and use standard HTTP status codes. Authentication is handled via JWT tokens passed in the Authorization header.

## Authentication

All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "status": "ACTIVE",
    "admin": {
      "permissions": {
        "canManageUsers": true,
        "canManageClasses": true,
        "canViewReports": true,
        "canManageSystem": true
      }
    }
  }
}
```

**Error Responses:**
- `401`: Invalid credentials or inactive account
- `400`: Invalid input data

#### POST /api/auth/register
Register a new user with role-specific data.

**Request Body:**
```json
{
  "user": {
    "email": "teacher@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890",
    "address": "123 Main St",
    "role": "TEACHER"
  },
  "teacherData": {
    "employeeId": "T001",
    "department": "Mathematics",
    "subject": "Algebra",
    "qualification": "M.Sc. Mathematics",
    "experience": 5,
    "salary": 50000,
    "joinDate": "2023-01-15T00:00:00.000Z"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "teacher@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "TEACHER",
    "teacher": {
      "employeeId": "T001",
      "department": "Mathematics",
      "subject": "Algebra",
      "qualification": "M.Sc. Mathematics",
      "experience": 5,
      "salary": 50000,
      "joinDate": "2023-01-15T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Invalid input data or validation errors
- `409`: User with this email already exists
- `500`: Internal server error

#### GET /api/auth/me
Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "status": "ACTIVE",
    "admin": {
      "permissions": {
        "canManageUsers": true,
        "canManageClasses": true,
        "canViewReports": true,
        "canManageSystem": true
      }
    }
  }
}
```

#### GET /api/auth/profile
Alias for `/api/auth/me`.

## User Management

### GET /api/users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `role`: Filter by role (ADMIN, TEACHER, STUDENT, PARENT)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "status": "ACTIVE",
      "admin": {
        "permissions": {
          "canManageUsers": true,
          "canManageClasses": true,
          "canViewReports": true,
          "canManageSystem": true
        }
      }
    }
  ],
  "pagination": {
    "current": 1,
    "total": 50,
    "limit": 10,
    "totalPages": 5
  }
}
```

### GET /api/users/[id]
Get user by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER",
    "status": "ACTIVE",
    "teacher": {
      "employeeId": "T001",
      "department": "Mathematics",
      "subject": "Algebra",
      "qualification": "M.Sc. Mathematics",
      "experience": 5,
      "salary": 50000,
      "joinDate": "2023-01-15T00:00:00.000Z"
    }
  }
}
```

### PUT /api/users/[id]
Update user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "phone": "+1234567890",
  "teacherData": {
    "salary": 55000
  }
}
```

### DELETE /api/users/[id]
Delete a user (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### GET /api/users/teachers
Get all teachers.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `subject`: Filter by subject
- `department`: Filter by department

### GET /api/users/students
Get all students.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `classId`: Filter by class
- `grade`: Filter by grade level

### GET /api/users/parents
Get all parents.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### GET /api/users/admins
Get all admins.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### GET /api/users/all
Get all users with basic information for dropdowns.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "TEACHER"
    }
  ]
}
```

### GET /api/users/dropdown-data
Get dropdown data for user selection.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "teachers": [
    {
      "id": "teacher_id",
      "name": "Jane Smith",
      "subject": "Mathematics"
    }
  ],
  "students": [
    {
      "id": "student_id",
      "name": "Bob Johnson",
      "class": "Grade 10-A"
    }
  ],
  "classes": [
    {
      "id": "class_id",
      "name": "Grade 10-A",
      "teacher": "Jane Smith"
    }
  ]
}
```

## Academic Management

### GET /api/academic/years
Get all academic years.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/academic/years
Create a new academic year.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "2023-2024",
  "startDate": "2023-09-01T00:00:00.000Z",
  "endDate": "2024-06-30T00:00:00.000Z",
  "isActive": true
}
```

### GET /api/academic/grades
Get all grade levels.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/academic/grades
Create a new grade level.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Grade 10",
  "level": 10,
  "description": "Tenth Grade"
}
```

### GET /api/academic/subjects
Get all subjects.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/academic/subjects
Create a new subject.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Basic Mathematics",
  "gradeId": "grade_id"
}
```

### GET /api/academic/classes
Get all classes.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `gradeId`: Filter by grade
- `teacherId`: Filter by teacher
- `academicYearId`: Filter by academic year

### POST /api/academic/classes
Create a new class.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Grade 10-A",
  "section": "A",
  "gradeId": "grade_id",
  "teacherId": "teacher_id",
  "capacity": 30,
  "academicYearId": "academic_year_id"
}
```

### GET /api/academic/classrooms
Get all classrooms.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/academic/classrooms
Create a new classroom.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Room 101",
  "capacity": 30,
  "building": "Main Building",
  "floor": 1,
  "facilities": ["Projector", "Whiteboard"]
}
```

## Timetable Management

### GET /api/timetable
Get timetable entries.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `classId`: Filter by class
- `teacherId`: Filter by teacher
- `dayOfWeek`: Filter by day (0-6, Sunday=0)
- `academicYearId`: Filter by academic year

### POST /api/timetable
Create a new timetable entry.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "classId": "class_id",
  "subjectId": "subject_id",
  "teacherId": "teacher_id",
  "classroomId": "classroom_id",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00",
  "academicYearId": "academic_year_id"
}
```

### PUT /api/timetable/[id]
Update a timetable entry.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### DELETE /api/timetable/[id]
Delete a timetable entry.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Attendance Management

### GET /api/attendance
Get attendance records.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `studentId`: Filter by student
- `classId`: Filter by class
- `date`: Filter by date (YYYY-MM-DD)
- `month`: Filter by month (YYYY-MM)
- `academicYearId`: Filter by academic year

### POST /api/attendance
Mark attendance for a student.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "studentId": "student_id",
  "classId": "class_id",
  "date": "2023-10-15",
  "status": "PRESENT",
  "markedById": "teacher_id",
  "notes": "On time"
}
```

**Status Values:**
- `PRESENT`
- `ABSENT`
- `LATE`
- `EXCUSED`

### PUT /api/attendance/[id]
Update attendance record.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### GET /api/attendance/report
Get attendance report.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `studentId`: Student ID (required for student-specific report)
- `classId`: Class ID
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

## Assignments Management

### GET /api/assignments
Get assignments.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `classId`: Filter by class
- `subjectId`: Filter by subject
- `teacherId`: Filter by teacher
- `dueDate`: Filter by due date

### POST /api/assignments
Create a new assignment.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Algebra Homework",
  "description": "Complete exercises 1-10 from chapter 5",
  "classId": "class_id",
  "subjectId": "subject_id",
  "teacherId": "teacher_id",
  "dueDate": "2023-10-20T23:59:59.000Z",
  "totalMarks": 100,
  "instructions": "Show all working steps"
}
```

### GET /api/assignments/[id]
Get assignment details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### PUT /api/assignments/[id]
Update assignment.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### DELETE /api/assignments/[id]
Delete assignment.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/assignments/[id]/submit
Submit assignment (Student).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "submissionText": "My solution...",
  "attachments": ["file_url_1", "file_url_2"]
}
```

### PUT /api/assignments/[id]/grade
Grade assignment submission (Teacher).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "studentId": "student_id",
  "marks": 85,
  "feedback": "Good work, but check your calculations"
}
```

## Exams Management

### GET /api/exams
Get exams.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `classId`: Filter by class
- `subjectId`: Filter by subject
- `examType`: Filter by type (QUIZ, MIDTERM, FINAL, etc.)

### POST /api/exams
Create a new exam.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Mathematics Midterm",
  "description": "Chapters 1-5",
  "classId": "class_id",
  "subjectId": "subject_id",
  "examType": "MIDTERM",
  "examDate": "2023-11-15T10:00:00.000Z",
  "duration": 120,
  "totalMarks": 100,
  "instructions": "Bring calculator and ID"
}
```

### GET /api/exams/[id]
Get exam details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### PUT /api/exams/[id]
Update exam.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### DELETE /api/exams/[id]
Delete exam.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/exams/[id]/results
Add exam results.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "results": [
    {
      "studentId": "student_id_1",
      "marks": 85,
      "grade": "A",
      "remarks": "Excellent performance"
    },
    {
      "studentId": "student_id_2",
      "marks": 72,
      "grade": "B",
      "remarks": "Good work"
    }
  ]
}
```

## Announcements

### GET /api/announcements
Get announcements.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `targetRole`: Filter by target role (ALL, ADMIN, TEACHER, STUDENT, PARENT)
- `isActive`: Filter by active status

### POST /api/announcements
Create a new announcement.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "School Holiday Notice",
  "content": "School will be closed on Monday due to holiday",
  "targetRole": "ALL",
  "priority": "HIGH",
  "expiresAt": "2023-10-16T23:59:59.000Z",
  "attachments": ["file_url"]
}
```

**Priority Values:**
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### PUT /api/announcements/[id]
Update announcement.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### DELETE /api/announcements/[id]
Delete announcement.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Events Management

### GET /api/events
Get events.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `startDate`: Start date filter
- `endDate`: End date filter
- `type`: Event type filter

### POST /api/events
Create a new event.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Parent-Teacher Meeting",
  "description": "Monthly PTM",
  "startDate": "2023-10-20T14:00:00.000Z",
  "endDate": "2023-10-20T16:00:00.000Z",
  "location": "School Auditorium",
  "eventType": "MEETING",
  "targetAudience": ["PARENTS", "TEACHERS"],
  "isAllDay": false
}
```

**Event Types:**
- `ACADEMIC`
- `SPORTS`
- `CULTURAL`
- `MEETING`
- `HOLIDAY`
- `EXAM`
- `OTHER`

## Chat and Messaging

### GET /api/chats
Get user's chat conversations.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/chats
Create a new chat conversation.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "participantIds": ["user_id_1", "user_id_2"],
  "type": "DIRECT",
  "name": "Project Discussion"
}
```

**Chat Types:**
- `DIRECT`: One-on-one chat
- `GROUP`: Group chat

### GET /api/chats/[id]/messages
Get messages from a chat.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit`: Number of messages to retrieve (default: 50)
- `before`: Get messages before this message ID

### POST /api/chats/[id]/messages
Send a message to a chat.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "messageType": "TEXT",
  "attachments": ["file_url"]
}
```

**Message Types:**
- `TEXT`
- `IMAGE`
- `FILE`
- `SYSTEM`

## Notifications

### GET /api/notifications
Get user's notifications.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `read`: Filter by read status (true/false)
- `limit`: Number of notifications (default: 20)

### PUT /api/notifications/[id]/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/notifications/mark-all-read
Mark all notifications as read.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Reports and Analytics

### GET /api/reports/students
Get student reports.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `classId`: Filter by class
- `academicYearId`: Filter by academic year

### GET /api/reports/attendance
Get attendance reports.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `classId`: Filter by class
- `startDate`: Start date
- `endDate`: End date

### GET /api/reports/performance
Get performance reports.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `studentId`: Filter by student
- `subjectId`: Filter by subject
- `academicYearId`: Filter by academic year

### GET /api/dashboard/stats
Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "totalStudents": 450,
  "totalTeachers": 25,
  "totalClasses": 15,
  "totalSubjects": 12,
  "attendanceToday": {
    "present": 420,
    "absent": 30,
    "percentage": 93.3
  },
  "upcomingEvents": 5,
  "pendingAssignments": 8
}
```

## File Upload

### POST /api/upload
Upload a file.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The file to upload
- `type`: File type (PROFILE, ASSIGNMENT, ANNOUNCEMENT, etc.)

**Response (200):**
```json
{
  "success": true,
  "file": {
    "id": "file_id",
    "filename": "document.pdf",
    "url": "/uploads/documents/document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  }
}
```

## Error Responses

All endpoints follow consistent error response formats:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- General endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- File upload endpoints: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

## WebSocket Events

The system uses Socket.IO for real-time communication. Connect to `/api/socket` with authentication.

### Authentication
```javascript
const socket = io('/api/socket', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Join Rooms
```javascript
// Join user-specific room
socket.emit('join-user', userId);

// Join class room
socket.emit('join-class', classId);
```

#### Real-time Updates
```javascript
// Listen for attendance updates
socket.on('attendance-changed', (data) => {
  console.log('Attendance updated:', data);
});

// Listen for new announcements
socket.on('new-announcement', (data) => {
  console.log('New announcement:', data);
});

// Listen for new messages
socket.on('new-message', (data) => {
  console.log('New message:', data);
});
```

#### Send Updates
```javascript
// Broadcast attendance update
socket.emit('attendance-updated', {
  classId: 'class_id',
  studentId: 'student_id',
  status: 'PRESENT'
});

// Send message
socket.emit('send-message', {
  chatId: 'chat_id',
  content: 'Hello!',
  type: 'TEXT'
});
```