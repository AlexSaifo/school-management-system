import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  TargetRole,
  CreateNotificationRequest,
  AnnouncementNotification,
  EventNotification,
  AssignmentNotification,
  ExamNotification,
  TimetableUpdateNotification,
  AssignmentSubmissionNotification,
  GradePublishedNotification,
  AttendanceAlertNotification,
  ChatMessageNotification
} from '@/types/notifications';
import { User, Event, Announcement, Assignment, Exam, Student, Teacher } from '@prisma/client';

interface NotificationData {
  user: User;
  entity: any;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create an announcement notification
   */
  public createAnnouncementNotification(
    announcement: Announcement & { creator: User },
    createdBy: User
  ): AnnouncementNotification {
    return {
      id: `notification-${announcement.id}-${Date.now()}`,
      type: NotificationType.ANNOUNCEMENT,
      title: announcement.title,
      titleAr: announcement.title, // Assuming title is already bilingual or needs translation
      message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
      messageAr: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
      priority: announcement.priority as NotificationPriority,
      targetRoles: announcement.targetRoles as TargetRole[],
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      expiresAt: announcement.expiresAt?.toISOString(),
      metadata: {
        announcementId: announcement.id,
        isActive: announcement.isActive,
      },
    };
  }

  /**
   * Create an event notification
   */
  public createEventNotification(
    event: Event & { creator: User },
    createdBy: User
  ): EventNotification {
    return {
      id: `notification-${event.id}-${Date.now()}`,
      type: NotificationType.EVENT,
      title: event.title,
      titleAr: event.titleAr || event.title,
      message: `New event: ${event.title}${event.description ? ' - ' + event.description.substring(0, 100) : ''}`,
      messageAr: `حدث جديد: ${event.titleAr || event.title}${event.descriptionAr ? ' - ' + event.descriptionAr.substring(0, 100) : ''}`,
      priority: NotificationPriority.NORMAL,
      targetRoles: event.targetRoles as TargetRole[],
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: {
        eventId: event.id,
        eventDate: event.eventDate.toISOString(),
        eventTime: event.eventTime || undefined,
        location: event.location || undefined,
        locationAr: event.locationAr || undefined,
        eventType: event.type,
      },
    };
  }

  /**
   * Create an assignment notification
   */
  public createAssignmentNotification(
    assignment: Assignment & { 
      teacher: Teacher & { user: User },
      classRoom: { name: string },
      subject: { name: string, nameAr?: string }
    },
    createdBy: User
  ): AssignmentNotification {
    return {
      id: `notification-${assignment.id}-${Date.now()}`,
      type: NotificationType.ASSIGNMENT,
      title: `New Assignment: ${assignment.title}`,
      titleAr: `واجب جديد: ${assignment.title}`,
      message: `New assignment "${assignment.title}" for ${assignment.subject.name} - Due: ${assignment.dueDate.toLocaleDateString()}`,
      messageAr: `واجب جديد "${assignment.title}" لمادة ${assignment.subject.nameAr || assignment.subject.name} - موعد التسليم: ${assignment.dueDate.toLocaleDateString('ar')}`,
      priority: NotificationPriority.NORMAL,
      targetRoles: [TargetRole.STUDENTS, TargetRole.PARENTS],
      targetClasses: [assignment.classRoomId],
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: {
        assignmentId: assignment.id,
        classRoomId: assignment.classRoomId,
        className: assignment.classRoom.name,
        subjectId: assignment.subjectId,
        subjectName: assignment.subject.name,
        subjectNameAr: assignment.subject.nameAr,
        dueDate: assignment.dueDate.toISOString(),
        totalMarks: Number(assignment.totalMarks),
      },
    };
  }

  /**
   * Create an exam notification
   */
  public createExamNotification(
    exam: Exam & { 
      teacher: Teacher & { user: User },
      classRoom: { name: string },
      subject: { name: string, nameAr?: string }
    },
    createdBy: User
  ): ExamNotification {
    return {
      id: `notification-${exam.id}-${Date.now()}`,
      type: NotificationType.EXAM,
      title: `New Exam: ${exam.title}`,
      titleAr: `امتحان جديد: ${exam.title}`,
      message: `New exam "${exam.title}" for ${exam.subject.name} - Date: ${exam.examDate.toLocaleDateString()}`,
      messageAr: `امتحان جديد "${exam.title}" لمادة ${exam.subject.nameAr || exam.subject.name} - التاريخ: ${exam.examDate.toLocaleDateString('ar')}`,
      priority: NotificationPriority.HIGH,
      targetRoles: [TargetRole.STUDENTS, TargetRole.PARENTS],
      targetClasses: [exam.classRoomId],
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: {
        examId: exam.id,
        classRoomId: exam.classRoomId,
        className: exam.classRoom.name,
        subjectId: exam.subjectId,
        subjectName: exam.subject.name,
        subjectNameAr: exam.subject.nameAr,
        examDate: exam.examDate.toISOString(),
        duration: exam.duration,
        totalMarks: Number(exam.totalMarks),
      },
    };
  }

  /**
   * Create a timetable update notification
   */
  public createTimetableUpdateNotification(
    classRoom: { id: string, name: string },
    updateType: 'SCHEDULE_CHANGE' | 'NEW_SCHEDULE' | 'TEACHER_CHANGE' | 'LOCATION_CHANGE',
    createdBy: User,
    metadata?: {
      affectedDate?: string;
      affectedTimeSlot?: string;
      oldValue?: string;
      newValue?: string;
    }
  ): TimetableUpdateNotification {
    const typeMessages = {
      SCHEDULE_CHANGE: 'Schedule has been updated',
      NEW_SCHEDULE: 'New schedule published',
      TEACHER_CHANGE: 'Teacher change in schedule',
      LOCATION_CHANGE: 'Classroom change in schedule'
    };

    const typeMessagesAr = {
      SCHEDULE_CHANGE: 'تم تحديث الجدول الدراسي',
      NEW_SCHEDULE: 'تم نشر جدول جديد',
      TEACHER_CHANGE: 'تغيير معلم في الجدول',
      LOCATION_CHANGE: 'تغيير فصل في الجدول'
    };

    return {
      id: `notification-timetable-${classRoom.id}-${Date.now()}`,
      type: NotificationType.TIMETABLE_UPDATE,
      title: `Timetable Update: ${classRoom.name}`,
      titleAr: `تحديث الجدول: ${classRoom.name}`,
      message: `${typeMessages[updateType]} for ${classRoom.name}`,
      messageAr: `${typeMessagesAr[updateType]} لـ ${classRoom.name}`,
      priority: NotificationPriority.NORMAL,
      targetRoles: [TargetRole.STUDENTS, TargetRole.PARENTS, TargetRole.TEACHERS],
      targetClasses: [classRoom.id],
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: {
        classRoomId: classRoom.id,
        className: classRoom.name,
        updateType,
        ...metadata,
      },
    };
  }

  /**
   * Create assignment submission notification (for teachers)
   */
  public createAssignmentSubmissionNotification(
    submission: {
      id: string;
      submittedAt: Date;
      assignment: Assignment & { 
        title: string;
        classRoom: { id: string, name: string };
        subject: { name: string };
      };
      student: Student & { user: User };
    },
    createdBy: User
  ): AssignmentSubmissionNotification {
    return {
      id: `notification-submission-${submission.id}-${Date.now()}`,
      type: NotificationType.ASSIGNMENT_SUBMISSION,
      title: `Assignment Submitted: ${submission.assignment.title}`,
      titleAr: `تم تسليم واجب: ${submission.assignment.title}`,
      message: `${submission.student.user.firstName} ${submission.student.user.lastName} submitted "${submission.assignment.title}"`,
      messageAr: `قام ${submission.student.user.firstName} ${submission.student.user.lastName} بتسليم واجب "${submission.assignment.title}"`,
      priority: NotificationPriority.LOW,
      targetRoles: [TargetRole.TEACHERS],
      targetUsers: [submission.assignment.teacherId], // Notify specific teacher
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: {
        assignmentId: submission.assignment.id,
        assignmentTitle: submission.assignment.title,
        studentId: submission.student.id,
        studentName: `${submission.student.user.firstName} ${submission.student.user.lastName}`,
        submissionId: submission.id,
        submittedAt: submission.submittedAt.toISOString(),
        classRoomId: submission.assignment.classRoom.id,
        className: submission.assignment.classRoom.name,
        subjectName: submission.assignment.subject.name,
      },
    };
  }

  /**
   * Create grade published notification
   */
  public createGradePublishedNotification(
    gradeData: {
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
    },
    createdBy: User
  ): GradePublishedNotification {
    return {
      id: `notification-grade-${gradeData.assignmentId || gradeData.examId}-${gradeData.studentId}-${Date.now()}`,
      type: NotificationType.GRADE_PUBLISHED,
      title: `Grade Published: ${gradeData.title}`,
      titleAr: `تم نشر الدرجة: ${gradeData.title}`,
      message: `Grade published for "${gradeData.title}" - Score: ${gradeData.marksObtained}/${gradeData.totalMarks}`,
      messageAr: `تم نشر درجة "${gradeData.title}" - النتيجة: ${gradeData.marksObtained}/${gradeData.totalMarks}`,
      priority: NotificationPriority.NORMAL,
      targetRoles: [TargetRole.STUDENTS, TargetRole.PARENTS],
      targetUsers: [gradeData.studentId],
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: gradeData,
    };
  }

  /**
   * Create attendance alert notification
   */
  public createAttendanceAlertNotification(
    attendanceData: {
      studentId: string;
      studentName: string;
      classRoomId: string;
      className: string;
      date: string;
      status: 'ABSENT' | 'LATE' | 'LOW_ATTENDANCE';
      attendancePercentage?: number;
    },
    createdBy: User
  ): AttendanceAlertNotification {
    const statusMessages = {
      ABSENT: 'was absent today',
      LATE: 'was late today',
      LOW_ATTENDANCE: 'has low attendance rate'
    };

    const statusMessagesAr = {
      ABSENT: 'غائب اليوم',
      LATE: 'متأخر اليوم',
      LOW_ATTENDANCE: 'نسبة حضور منخفضة'
    };

    return {
      id: `notification-attendance-${attendanceData.studentId}-${Date.now()}`,
      type: NotificationType.ATTENDANCE_ALERT,
      title: `Attendance Alert: ${attendanceData.studentName}`,
      titleAr: `تنبيه حضور: ${attendanceData.studentName}`,
      message: `${attendanceData.studentName} ${statusMessages[attendanceData.status]}${attendanceData.attendancePercentage ? ` (${attendanceData.attendancePercentage}%)` : ''}`,
      messageAr: `${attendanceData.studentName} ${statusMessagesAr[attendanceData.status]}${attendanceData.attendancePercentage ? ` (${attendanceData.attendancePercentage}%)` : ''}`,
      priority: attendanceData.status === 'LOW_ATTENDANCE' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      targetRoles: [TargetRole.PARENTS, TargetRole.TEACHERS],
      targetUsers: [attendanceData.studentId], // Will be expanded to include parents
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: attendanceData,
    };
  }

  /**
   * Create a chat message notification
   */
  public createChatMessageNotification(
    messageData: {
      chatId: string;
      messageId: string;
      senderId: string;
      senderName: string;
      chatType: 'DIRECT' | 'GROUP';
      chatName?: string;
      messagePreview: string;
    },
    createdBy: User
  ): ChatMessageNotification {
    const chatDisplayName = messageData.chatType === 'DIRECT' 
      ? messageData.senderName 
      : (messageData.chatName || 'Group Chat');

    return {
      id: `notification-chat-${messageData.chatId}-${messageData.messageId}`,
      type: NotificationType.CHAT_MESSAGE,
      title: `New message from ${chatDisplayName}`,
      titleAr: `رسالة جديدة من ${chatDisplayName}`,
      message: messageData.messagePreview,
      messageAr: messageData.messagePreview,
      priority: NotificationPriority.NORMAL,
      targetRoles: [], // Will be set based on chat participants
      targetUsers: [], // Will be set based on chat participants
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      metadata: messageData,
    };
  }

  /**
   * Determine target users based on roles and class restrictions
   */
  public async getTargetUsers(
    notification: Notification,
    prisma: any // PrismaClient type would be imported in actual usage
  ): Promise<string[]> {
    const targetUsers = new Set<string>();

    // Add explicitly targeted users
    if (notification.targetUsers) {
      notification.targetUsers.forEach(userId => targetUsers.add(userId));
    }

    // Process role-based targeting
    for (const role of notification.targetRoles) {
      switch (role) {
        case TargetRole.ALL:
          const allUsers = await prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true }
          });
          allUsers.forEach((user: { id: string }) => targetUsers.add(user.id));
          break;

        case TargetRole.STUDENTS:
          if (notification.targetClasses && notification.targetClasses.length > 0) {
            // Target students in specific classes
            const classStudents = await prisma.student.findMany({
              where: {
                classRoomId: { in: notification.targetClasses },
                user: { status: 'ACTIVE' }
              },
              select: { userId: true }
            });
            classStudents.forEach((student: { userId: string }) => targetUsers.add(student.userId));
          } else {
            // Target all students
            const allStudents = await prisma.student.findMany({
              where: { user: { status: 'ACTIVE' } },
              select: { userId: true }
            });
            allStudents.forEach((student: { userId: string }) => targetUsers.add(student.userId));
          }
          break;

        case TargetRole.PARENTS:
          if (notification.targetClasses && notification.targetClasses.length > 0) {
            // Target parents of students in specific classes
            const classParents = await prisma.studentParent.findMany({
              where: {
                student: {
                  classRoomId: { in: notification.targetClasses },
                  user: { status: 'ACTIVE' }
                }
              },
              include: { parent: { select: { userId: true } } }
            });
            classParents.forEach((sp: { parent: { userId: string } }) => targetUsers.add(sp.parent.userId));
          } else {
            // Target all parents
            const allParents = await prisma.parent.findMany({
              where: { user: { status: 'ACTIVE' } },
              select: { userId: true }
            });
            allParents.forEach((parent: { userId: string }) => targetUsers.add(parent.userId));
          }
          break;

        case TargetRole.TEACHERS:
          if (notification.targetClasses && notification.targetClasses.length > 0) {
            // Target teachers of specific classes
            const classTeachers = await prisma.classRoom.findMany({
              where: { id: { in: notification.targetClasses } },
              include: { classTeacher: { select: { userId: true } } }
            });
            classTeachers.forEach((classRoom: { classTeacher: { userId: string } | null }) => {
              if (classRoom.classTeacher) {
                targetUsers.add(classRoom.classTeacher.userId);
              }
            });
          } else {
            // Target all teachers
            const allTeachers = await prisma.teacher.findMany({
              where: { user: { status: 'ACTIVE' } },
              select: { userId: true }
            });
            allTeachers.forEach((teacher: { userId: string }) => targetUsers.add(teacher.userId));
          }
          break;

        case TargetRole.ADMINS:
          const allAdmins = await prisma.admin.findMany({
            where: { user: { status: 'ACTIVE' } },
            select: { userId: true }
          });
          allAdmins.forEach((admin: { userId: string }) => targetUsers.add(admin.userId));
          break;
      }
    }

    return Array.from(targetUsers);
  }

  /**
   * Helper method to create notification from request data
   */
  public createCustomNotification(
    request: CreateNotificationRequest,
    createdBy: User
  ): Notification {
    return {
      id: `notification-custom-${Date.now()}`,
      type: request.type,
      title: request.title,
      titleAr: request.titleAr,
      message: request.message,
      messageAr: request.messageAr,
      priority: request.priority || NotificationPriority.NORMAL,
      targetRoles: request.targetRoles || [TargetRole.ALL],
      targetUsers: request.targetUsers,
      targetClasses: request.targetClasses,
      createdById: createdBy.id,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
        role: createdBy.role,
      },
      createdAt: new Date().toISOString(),
      expiresAt: request.expiresAt,
      metadata: request.metadata || {},
    } as Notification;
  }
}

export const notificationService = NotificationService.getInstance();