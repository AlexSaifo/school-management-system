export enum NotificationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EVENT = 'EVENT',
  ASSIGNMENT = 'ASSIGNMENT',
  EXAM = 'EXAM',
  TIMETABLE_UPDATE = 'TIMETABLE_UPDATE',
  ASSIGNMENT_SUBMISSION = 'ASSIGNMENT_SUBMISSION',
  GRADE_PUBLISHED = 'GRADE_PUBLISHED',
  ATTENDANCE_ALERT = 'ATTENDANCE_ALERT',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TargetRole {
  ALL = 'ALL',
  STUDENTS = 'STUDENTS',
  PARENTS = 'PARENTS',
  TEACHERS = 'TEACHERS',
  ADMINS = 'ADMINS',
}

export interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  priority: NotificationPriority;
  targetRoles: TargetRole[];
  targetUsers?: string[]; // Specific user IDs
  targetClasses?: string[]; // Specific class IDs
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  isRead?: boolean;
  readAt?: string;
}

export interface AnnouncementNotification extends BaseNotification {
  type: NotificationType.ANNOUNCEMENT;
  metadata: {
    announcementId: string;
    isActive: boolean;
  };
}

export interface EventNotification extends BaseNotification {
  type: NotificationType.EVENT;
  metadata: {
    eventId: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    locationAr?: string;
    eventType: string;
  };
}

export interface AssignmentNotification extends BaseNotification {
  type: NotificationType.ASSIGNMENT;
  metadata: {
    assignmentId: string;
    classRoomId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    subjectNameAr?: string;
    dueDate: string;
    totalMarks: number;
  };
}

export interface ExamNotification extends BaseNotification {
  type: NotificationType.EXAM;
  metadata: {
    examId: string;
    classRoomId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    subjectNameAr?: string;
    examDate: string;
    duration: number;
    totalMarks: number;
  };
}

export interface TimetableUpdateNotification extends BaseNotification {
  type: NotificationType.TIMETABLE_UPDATE;
  metadata: {
    classRoomId: string;
    className: string;
    updateType: 'SCHEDULE_CHANGE' | 'NEW_SCHEDULE' | 'TEACHER_CHANGE' | 'LOCATION_CHANGE';
    affectedDate?: string;
    affectedTimeSlot?: string;
    oldValue?: string;
    newValue?: string;
  };
}

export interface AssignmentSubmissionNotification extends BaseNotification {
  type: NotificationType.ASSIGNMENT_SUBMISSION;
  metadata: {
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    studentName: string;
    submissionId: string;
    submittedAt: string;
    classRoomId: string;
    className: string;
    subjectName: string;
  };
}

export interface GradePublishedNotification extends BaseNotification {
  type: NotificationType.GRADE_PUBLISHED;
  metadata: {
    studentId: string;
    studentName: string;
    assignmentId?: string;
    examId?: string;
    title: string;
    marksObtained: number;
    totalMarks: number;
    grade?: string;
    classRoomId: string;
    className: string;
    subjectName: string;
  };
}

export interface AttendanceAlertNotification extends BaseNotification {
  type: NotificationType.ATTENDANCE_ALERT;
  metadata: {
    studentId: string;
    studentName: string;
    classRoomId: string;
    className: string;
    date: string;
    status: 'ABSENT' | 'LATE' | 'LOW_ATTENDANCE';
    attendancePercentage?: number;
  };
}

export interface ChatMessageNotification extends BaseNotification {
  type: NotificationType.CHAT_MESSAGE;
  metadata: {
    chatId: string;
    messageId: string;
    senderId: string;
    senderName: string;
    chatType: 'DIRECT' | 'GROUP';
    chatName?: string;
    messagePreview: string;
  };
}

export type Notification = 
  | AnnouncementNotification
  | EventNotification
  | AssignmentNotification
  | ExamNotification
  | TimetableUpdateNotification
  | AssignmentSubmissionNotification
  | GradePublishedNotification
  | AttendanceAlertNotification
  | ChatMessageNotification;

// Socket event types
export interface NotificationSocketEvents {
  // Client to Server
  'join-notifications': { roles: TargetRole[] };
  'mark-notification-read': { notificationId: string };
  'get-unread-count': void;

  // Server to Client
  'new-notification': Notification;
  'notification-read': { notificationId: string; readBy: string };
  'unread-count': { count: number };
}

// API request/response types
export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  priority?: NotificationPriority;
  targetRoles?: TargetRole[];
  targetUsers?: string[];
  targetClasses?: string[];
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilter {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  targetRole?: TargetRole;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}