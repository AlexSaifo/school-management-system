# Database Schema & Relationships

## Database Overview

The School Management System uses PostgreSQL as its primary database, with Prisma ORM for type-safe database operations. The schema is designed following normalization principles while maintaining performance and flexibility.

## Core Design Principles

### 📏 Normalization Strategy
- **1NF**: Atomic values, no repeating groups
- **2NF**: No partial dependencies on composite keys
- **3NF**: No transitive dependencies
- **BCNF**: Every determinant is a candidate key

### 🔗 Relationship Patterns
- **One-to-One**: User → Admin/Teacher/Student/Parent
- **One-to-Many**: ClassRoom → Students, Teacher → Classes
- **Many-to-Many**: Students ↔ Parents, Subjects ↔ Teachers

### 🏷️ Naming Conventions
- **Tables**: snake_case (users, class_rooms)
- **Columns**: camelCase (firstName, isActive)
- **Foreign Keys**: `{tableName}{Id}` (userId, classRoomId)
- **Indexes**: Automatic on foreign keys and unique constraints

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ACADEMIC HIERARCHY                        │
├─────────────────────────────────────────────────────────────────────┤
│  AcademicYear (1) ──── (M) Semester                                │
│      │                                                                │
│      └── (M) ClassRoom ──── (M) Student                              │
│              │               │                                       │
│              │               └── (M) Attendance                      │
│              │               └── (M) Grade                           │
│              │               └── (M) AssignmentSubmission           │
│              │               └── (M) ExamResult                      │
│              │                                                       │
│              └── (M) Timetable ──── (1) Subject                      │
│                      │                                               │
│                      └── (1) Teacher                                 │
│                      └── (1) SpecialLocation                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                            USER SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│  User (Base) ──── (1) Admin                                         │
│      │                                                              │
│      ├── (1) Teacher ──── (M) TeacherSubject                        │
│      │               │                                               │
│      │               └── (M) ClassRoom (as classTeacher)            │
│      │               └── (M) Attendance                             │
│      │               └── (M) Assignment                             │
│      │               └── (M) Exam                                   │
│      │               └── (M) Timetable                              │
│      │                                                              │
│      ├── (1) Student ──── (M) StudentParent                         │
│      │                                                              │
│      └── (1) Parent ──── (M) StudentParent                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          COMMUNICATION                              │
├─────────────────────────────────────────────────────────────────────┤
│  User ──── (M) Chat ──── (M) ChatParticipant                        │
│      │                                                              │
│      └── (M) Message ──── (M) MessageReadReceipt                    │
│                                                                     │
│  User ──── (M) Announcement                                         │
│  User ──── (M) Event                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Detailed Schema Documentation

### 🔐 User Management System

#### User (Base Table)
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR,
  role ROLE NOT NULL DEFAULT 'STUDENT',
  status STATUS NOT NULL DEFAULT 'ACTIVE',
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  phone VARCHAR,
  address VARCHAR,
  avatar VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-One with Admin, Teacher, Student, Parent
- One-to-Many with Events, Announcements
- Many-to-Many with Chats (via ChatParticipant)

**Indexes:**
- `email` (unique)
- `role`
- `status`

#### Role-Specific Tables

**Admin:**
```sql
CREATE TABLE admins (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Teacher:**
```sql
CREATE TABLE teachers (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employeeId VARCHAR UNIQUE NOT NULL,
  department VARCHAR NOT NULL,
  qualification VARCHAR NOT NULL,
  experience INTEGER NOT NULL,
  salary DECIMAL,
  joinDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Student:**
```sql
CREATE TABLE students (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  studentId VARCHAR UNIQUE NOT NULL,
  classRoomId VARCHAR REFERENCES class_rooms(id),
  rollNumber VARCHAR,
  dateOfBirth DATE NOT NULL,
  bloodGroup VARCHAR,
  emergencyContact VARCHAR,
  admissionDate DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-One with User
- Many-to-One with ClassRoom
- One-to-Many with StudentParent
- One-to-Many with Attendance
- One-to-Many with Grade
- One-to-Many with AssignmentSubmission
- One-to-Many with ExamResult
- One-to-Many with StudentAcademicProgression

**Parent:**
```sql
CREATE TABLE parents (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  userId VARCHAR UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  occupation VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### StudentAcademicProgression
```sql
CREATE TABLE student_academic_progressions (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  studentId VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fromAcademicYearId VARCHAR REFERENCES academic_years(id),
  fromSemesterId VARCHAR REFERENCES semesters(id),
  fromGradeLevelId VARCHAR REFERENCES grade_levels(id),
  fromClassRoomId VARCHAR REFERENCES class_rooms(id),
  toAcademicYearId VARCHAR NOT NULL REFERENCES academic_years(id),
  toSemesterId VARCHAR REFERENCES semesters(id),
  toGradeLevelId VARCHAR NOT NULL REFERENCES grade_levels(id),
  toClassRoomId VARCHAR REFERENCES class_rooms(id),
  progressionType PROGRESSION_TYPE NOT NULL,
  reason VARCHAR,
  effectiveDate DATE NOT NULL,
  processedById VARCHAR NOT NULL REFERENCES users(id),
  notes VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Student
- Many-to-One with AcademicYear (from/to)
- Many-to-One with Semester (from/to)
- Many-to-One with GradeLevel (from/to)
- Many-to-One with ClassRoom (from/to)
- Many-to-One with User (processedBy)

**Progression Types:**
- `PROMOTED`: Student moved to next grade
- `RETAINED`: Student kept in same grade
- `GRADUATED`: Student completed final grade
- `TRANSFERRED`: Student transferred to another school
- `ENROLLED`: Initial enrollment

### 📚 Academic Structure

#### AcademicYear
```sql
CREATE TABLE academic_years (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  status ACADEMIC_YEAR_STATUS NOT NULL DEFAULT 'PLANNING',
  isActive BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-Many with Semesters
- One-to-Many with ClassRooms
- One-to-Many with Subjects
- One-to-Many with StudentAcademicProgression (from/to year)

#### Semester
```sql
CREATE TABLE semesters (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  status SEMESTER_STATUS NOT NULL DEFAULT 'PLANNING',
  days INTEGER NOT NULL DEFAULT 90,
  completedDays INTEGER NOT NULL DEFAULT 0,
  isActive BOOLEAN NOT NULL DEFAULT FALSE,
  academicYearId VARCHAR NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with AcademicYear
- One-to-Many with ClassRooms
- One-to-Many with Subjects
- One-to-Many with Timetables
- One-to-Many with Assignments
- One-to-Many with Exams
- One-to-Many with StudentAcademicProgression (from/to semester)

#### GradeLevel
```sql
CREATE TABLE grade_levels (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  level INTEGER NOT NULL,
  description VARCHAR,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-Many with ClassRooms
- One-to-Many with GradeSubjects
- One-to-Many with StudentAcademicProgression (from/to grade)

#### ClassRoom
```sql
CREATE TABLE class_rooms (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  section VARCHAR NOT NULL,
  sectionNumber INTEGER NOT NULL,
  gradeLevelId VARCHAR NOT NULL REFERENCES grade_levels(id),
  classTeacherId VARCHAR REFERENCES teachers(id),
  roomNumber VARCHAR UNIQUE NOT NULL,
  floor INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  facilities VARCHAR[],
  academicYearId VARCHAR NOT NULL REFERENCES academic_years(id),
  semesterId VARCHAR REFERENCES semesters(id),
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with GradeLevel
- Many-to-One with Teacher (classTeacher)
- Many-to-One with AcademicYear
- Many-to-One with Semester (optional)
- One-to-Many with Students
- One-to-Many with Timetables
- One-to-Many with StudentAcademicProgression (from/to class)

**Unique Constraints:**
- `(gradeLevelId, sectionNumber, academicYearId)`
- `roomNumber`

### 📖 Subjects & Curriculum

#### Subject
```sql
CREATE TABLE subjects (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  code VARCHAR UNIQUE NOT NULL,
  description VARCHAR,
  color VARCHAR,
  academicYearId VARCHAR REFERENCES academic_years(id),
  semesterId VARCHAR REFERENCES semesters(id),
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with AcademicYear (optional)
- Many-to-One with Semester (optional)
- Many-to-Many with Teachers (via TeacherSubject)
- Many-to-Many with GradeLevels (via GradeSubject)
- One-to-Many with Timetables

#### GradeSubject
```sql
CREATE TABLE grade_subjects (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  gradeLevelId VARCHAR NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
  subjectId VARCHAR NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  isRequired BOOLEAN NOT NULL DEFAULT TRUE,
  weeklyHours INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with GradeLevel
- Many-to-One with Subject

**Unique Constraint:**
- `(gradeLevelId, subjectId)`

#### TeacherSubject
```sql
CREATE TABLE teacher_subjects (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  teacherId VARCHAR NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subjectId VARCHAR NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  isPrimary BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Teacher
- Many-to-One with Subject

**Unique Constraint:**
- `(teacherId, subjectId)`

### 📅 Scheduling System

#### TimeSlot
```sql
CREATE TABLE time_slots (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  startTime VARCHAR NOT NULL,
  endTime VARCHAR NOT NULL,
  slotOrder INTEGER NOT NULL,
  slotType SLOT_TYPE NOT NULL DEFAULT 'LESSON',
  duration INTEGER NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-Many with Timetables

**Unique Constraint:**
- `slotOrder`

#### SpecialLocation
```sql
CREATE TABLE special_locations (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  nameAr VARCHAR,
  type LOCATION_TYPE NOT NULL,
  floor INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  facilities VARCHAR[],
  description VARCHAR,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- One-to-Many with Timetables

**Unique Constraint:**
- `name`

#### Timetable
```sql
CREATE TABLE timetables (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  classRoomId VARCHAR NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  subjectId VARCHAR REFERENCES subjects(id) ON DELETE CASCADE,
  teacherId VARCHAR REFERENCES teachers(id) ON DELETE CASCADE,
  specialLocationId VARCHAR REFERENCES special_locations(id),
  semesterId VARCHAR REFERENCES semesters(id),
  timeSlotId VARCHAR NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  dayOfWeek INTEGER NOT NULL,
  slotType SLOT_TYPE NOT NULL DEFAULT 'LESSON',
  notes VARCHAR,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with ClassRoom
- Many-to-One with Subject
- Many-to-One with Teacher
- Many-to-One with SpecialLocation
- Many-to-One with Semester
- Many-to-One with TimeSlot
- One-to-Many with Attendances

**Unique Constraints:**
- `(classRoomId, timeSlotId, dayOfWeek, semesterId)`

### 📊 Assessment & Grading

#### Assignment
```sql
CREATE TABLE assignments (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  title VARCHAR NOT NULL,
  titleAr VARCHAR,
  description VARCHAR,
  descriptionAr VARCHAR,
  subjectId VARCHAR NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacherId VARCHAR NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  classRoomId VARCHAR NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  semesterId VARCHAR REFERENCES semesters(id),
  dueDate DATE NOT NULL,
  totalMarks DECIMAL NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Subject
- Many-to-One with Teacher
- Many-to-One with ClassRoom
- Many-to-One with Semester
- One-to-Many with AssignmentSubmissions

#### AssignmentSubmission
```sql
CREATE TABLE assignment_submissions (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  assignmentId VARCHAR NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  studentId VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submittedAt TIMESTAMP,
  marks DECIMAL,
  feedback VARCHAR,
  fileUrl VARCHAR,
  status SUBMISSION_STATUS NOT NULL DEFAULT 'PENDING',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Assignment
- Many-to-One with Student

**Unique Constraint:**
- `(assignmentId, studentId)`

#### Exam
```sql
CREATE TABLE exams (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  title VARCHAR NOT NULL,
  titleAr VARCHAR,
  description VARCHAR,
  descriptionAr VARCHAR,
  subjectId VARCHAR NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacherId VARCHAR NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  classRoomId VARCHAR NOT NULL REFERENCES class_rooms(id) ON DELETE CASCADE,
  semesterId VARCHAR REFERENCES semesters(id),
  examDate DATE NOT NULL,
  startTime VARCHAR NOT NULL,
  endTime VARCHAR NOT NULL,
  totalMarks DECIMAL NOT NULL,
  examType EXAM_TYPE NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Subject
- Many-to-One with Teacher
- Many-to-One with ClassRoom
- Many-to-One with Semester
- One-to-Many with ExamResults

#### ExamResult
```sql
CREATE TABLE exam_results (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  examId VARCHAR NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  studentId VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks DECIMAL,
  grade VARCHAR,
  remarks VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Exam
- Many-to-One with Student

**Unique Constraint:**
- `(examId, studentId)`

#### Grade
```sql
CREATE TABLE grades (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  studentId VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subjectId VARCHAR NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semesterId VARCHAR REFERENCES semesters(id),
  grade VARCHAR NOT NULL,
  gradePoint DECIMAL,
  remarks VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Student
- Many-to-One with Subject
- Many-to-One with Semester

### 📍 Attendance System

#### Attendance
```sql
CREATE TABLE attendances (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  studentId VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  timetableId VARCHAR REFERENCES timetables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status ATTENDANCE_STATUS NOT NULL,
  remarks VARCHAR,
  markedById VARCHAR NOT NULL REFERENCES teachers(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Student
- Many-to-One with Timetable
- Many-to-One with Teacher (markedBy)

**Unique Constraint:**
- `(studentId, timetableId, date)`

### 💬 Communication System

#### Chat
```sql
CREATE TABLE chats (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR,
  type CHAT_TYPE NOT NULL DEFAULT 'DIRECT',
  createdById VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with User (createdBy)
- Many-to-Many with Users (via ChatParticipant)
- One-to-Many with Messages

#### ChatParticipant
```sql
CREATE TABLE chat_participants (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  chatId VARCHAR NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  userId VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role PARTICIPANT_ROLE NOT NULL DEFAULT 'MEMBER',
  joinedAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Chat
- Many-to-One with User

**Unique Constraint:**
- `(chatId, userId)`

#### Message
```sql
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  chatId VARCHAR NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  senderId VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR NOT NULL,
  messageType MESSAGE_TYPE NOT NULL DEFAULT 'TEXT',
  fileUrl VARCHAR,
  replyToId VARCHAR REFERENCES messages(id),
  isEdited BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Chat
- Many-to-One with User (sender)
- Many-to-One with Message (replyTo)
- One-to-Many with MessageReadReceipts

#### MessageReadReceipt
```sql
CREATE TABLE message_read_receipts (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  messageId VARCHAR NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  userId VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  readAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with Message
- Many-to-One with User

**Unique Constraint:**
- `(messageId, userId)`

### 📢 Announcements & Events

#### Announcement
```sql
CREATE TABLE announcements (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  title VARCHAR NOT NULL,
  titleAr VARCHAR,
  content VARCHAR NOT NULL,
  contentAr VARCHAR,
  targetRoles ROLE[],
  createdById VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  isPublished BOOLEAN NOT NULL DEFAULT FALSE,
  publishedAt TIMESTAMP,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with User (createdBy)

#### Event
```sql
CREATE TABLE events (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  title VARCHAR NOT NULL,
  titleAr VARCHAR,
  description VARCHAR,
  descriptionAr VARCHAR,
  eventDate DATE NOT NULL,
  eventTime VARCHAR,
  location VARCHAR,
  locationAr VARCHAR,
  type EVENT_TYPE NOT NULL DEFAULT 'GENERAL',
  targetRoles ROLE[] DEFAULT ['ALL'],
  createdById VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**
- Many-to-One with User (createdBy)

## Database Performance Optimizations

### Indexes
```sql
-- Foreign Key Indexes (automatically created)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Composite Indexes for Performance
CREATE INDEX idx_timetables_class_semester ON timetables(classRoomId, semesterId);
CREATE INDEX idx_attendances_student_date ON attendances(studentId, date);
CREATE INDEX idx_grades_student_semester ON grades(studentId, semesterId);

-- Full-text Search Indexes
CREATE INDEX idx_subjects_name_search ON subjects USING gin(to_tsvector('english', name));
CREATE INDEX idx_users_name_search ON users USING gin(to_tsvector('english', firstName || ' ' || lastName));
```

### Query Optimization Patterns

#### Efficient Pagination
```sql
-- Cursor-based pagination for large datasets
SELECT * FROM users
WHERE id > $cursor
ORDER BY id
LIMIT $limit;
```

#### Batch Operations
```sql
-- Bulk attendance marking
INSERT INTO attendances (studentId, timetableId, date, status, markedById)
SELECT s.id, $timetableId, $date, $status, $teacherId
FROM students s
WHERE s.classRoomId = $classId;
```

#### Materialized Views for Analytics
```sql
CREATE MATERIALIZED VIEW student_performance AS
SELECT
  s.id,
  s.firstName || ' ' || s.lastName as name,
  COUNT(a.id) as totalAttendance,
  AVG(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as attendanceRate,
  AVG(g.gradePoint) as avgGrade
FROM students s
LEFT JOIN attendances a ON s.id = a.studentId
LEFT JOIN grades g ON s.id = g.studentId
GROUP BY s.id, s.firstName, s.lastName;
```

## Data Integrity & Constraints

### Check Constraints
```sql
-- Grade validation
ALTER TABLE grades ADD CONSTRAINT grade_range
CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'));

-- Date validation
ALTER TABLE semesters ADD CONSTRAINT valid_date_range
CHECK (endDate > startDate);

-- Capacity validation
ALTER TABLE class_rooms ADD CONSTRAINT positive_capacity
CHECK (capacity > 0);
```

### Triggers for Data Consistency
```sql
-- Auto-update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Backup & Recovery Strategy

### Automated Backups
```bash
# Daily backup script
pg_dump -U school_admin -h localhost school_management > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U school_admin -h localhost school_management | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Point-in-Time Recovery
```sql
-- Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/lib/postgresql/archive/%f';
```

## Migration Strategy

### Prisma Migrations
```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Apply migrations
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset
```

### Data Migration Scripts
```typescript
// Custom migration for data transformation
async function migrateUserRoles() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    // Transform data as needed
  }
}
```

## Monitoring & Maintenance

### Database Health Checks
```sql
-- Connection count monitoring
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Table size monitoring
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Monitoring
```sql
-- Slow query identification
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

This comprehensive database schema provides a solid foundation for the School Management System, ensuring data integrity, performance, and scalability while supporting all required business functionality.