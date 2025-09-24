import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Create Grade Levels
    console.log('📚 Creating grade levels...');
    const gradeLevels = await Promise.all([
      prisma.gradeLevel.upsert({
        where: { level: 1 },
        update: {},
        create: {
          name: 'Grade 1',
          nameAr: 'الصف الأول',
          level: 1,
          description: 'First grade - Primary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 2 },
        update: {},
        create: {
          name: 'Grade 2',
          nameAr: 'الصف الثاني',
          level: 2,
          description: 'Second grade - Primary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 3 },
        update: {},
        create: {
          name: 'Grade 3',
          nameAr: 'الصف الثالث',
          level: 3,
          description: 'Third grade - Primary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 4 },
        update: {},
        create: {
          name: 'Grade 4',
          nameAr: 'الصف الرابع',
          level: 4,
          description: 'Fourth grade - Primary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 5 },
        update: {},
        create: {
          name: 'Grade 5',
          nameAr: 'الصف الخامس',
          level: 5,
          description: 'Fifth grade - Primary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 6 },
        update: {},
        create: {
          name: 'Grade 6',
          nameAr: 'الصف السادس',
          level: 6,
          description: 'Sixth grade - Primary School',
          isActive: true
        }
      })
    ]);

    // 2. Create Subjects
    console.log('📖 Creating subjects...');
    const subjects = await Promise.all([
      prisma.subject.upsert({
        where: { code: 'MATH' },
        update: {},
        create: {
          name: 'Mathematics',
          nameAr: 'الرياضيات',
          code: 'MATH',
          description: 'Mathematics subject covering arithmetic, algebra, and geometry',
          color: '#FF6B6B',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'SCIENCE' },
        update: {},
        create: {
          name: 'Science',
          nameAr: 'العلوم',
          code: 'SCIENCE',
          description: 'Science subject covering physics, chemistry, and biology',
          color: '#4ECDC4',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'ENGLISH' },
        update: {},
        create: {
          name: 'English',
          nameAr: 'الإنجليزية',
          code: 'ENGLISH',
          description: 'English language and literature',
          color: '#45B7D1',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'ARABIC' },
        update: {},
        create: {
          name: 'Arabic',
          nameAr: 'العربية',
          code: 'ARABIC',
          description: 'Arabic language and literature',
          color: '#96CEB4',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'HISTORY' },
        update: {},
        create: {
          name: 'History',
          nameAr: 'التاريخ',
          code: 'HISTORY',
          description: 'History and social studies',
          color: '#FECA57',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'GEOGRAPHY' },
        update: {},
        create: {
          name: 'Geography',
          nameAr: 'الجغرافيا',
          code: 'GEOGRAPHY',
          description: 'Geography and earth sciences',
          color: '#FF9FF3',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'ART' },
        update: {},
        create: {
          name: 'Art',
          nameAr: 'الفنون',
          code: 'ART',
          description: 'Visual arts and crafts',
          color: '#54A0FF',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'PHYSICAL_ED' },
        update: {},
        create: {
          name: 'Physical Education',
          nameAr: 'التربية البدنية',
          code: 'PHYSICAL_ED',
          description: 'Physical education and sports',
          color: '#5F27CD',
          isActive: true
        }
      })
    ]);

    // 2.5. Create Academic Years and Semesters
    console.log('📅 Creating academic years and semesters...');
    const academicYears = await Promise.all([
      prisma.academicYear.upsert({
        where: { name: '2022-2023' },
        update: {},
        create: {
          name: '2022-2023',
          nameAr: '2022-2023',
          startDate: new Date('2022-09-01'),
          endDate: new Date('2023-06-30'),
          status: 'COMPLETED',
          isActive: false,
          totalDays: 180,
          completedDays: 180,
          color: '#4caf50'
        }
      }),
      prisma.academicYear.upsert({
        where: { name: '2023-2024' },
        update: {},
        create: {
          name: '2023-2024',
          nameAr: '2023-2024',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-06-30'),
          status: 'COMPLETED',
          isActive: false,
          totalDays: 180,
          completedDays: 180,
          color: '#ff9800'
        }
      }),
      prisma.academicYear.upsert({
        where: { name: '2024-2025' },
        update: {},
        create: {
          name: '2024-2025',
          nameAr: '2024-2025',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-06-30'),
          status: 'ACTIVE',
          isActive: true,
          totalDays: 180,
          completedDays: 45,
          color: '#1976d2'
        }
      })
    ]);

    const semesters = await Promise.all([
      // 2022-2023 Semesters
      prisma.semester.create({
        data: {
          name: 'First Semester 2022-2023',
          nameAr: 'الفصل الدراسي الأول 2022-2023',
          startDate: new Date('2022-09-01'),
          endDate: new Date('2022-12-31'),
          status: 'COMPLETED',
          days: 90,
          completedDays: 90,
          isActive: false,
          academicYearId: academicYears[0].id
        }
      }),
      prisma.semester.create({
        data: {
          name: 'Second Semester 2022-2023',
          nameAr: 'الفصل الدراسي الثاني 2022-2023',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-30'),
          status: 'COMPLETED',
          days: 90,
          completedDays: 90,
          isActive: false,
          academicYearId: academicYears[0].id
        }
      }),
      // 2023-2024 Semesters
      prisma.semester.create({
        data: {
          name: 'First Semester 2023-2024',
          nameAr: 'الفصل الدراسي الأول 2023-2024',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2023-12-31'),
          status: 'COMPLETED',
          days: 90,
          completedDays: 90,
          isActive: false,
          academicYearId: academicYears[1].id
        }
      }),
      prisma.semester.create({
        data: {
          name: 'Second Semester 2023-2024',
          nameAr: 'الفصل الدراسي الثاني 2023-2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          status: 'COMPLETED',
          days: 90,
          completedDays: 90,
          isActive: false,
          academicYearId: academicYears[1].id
        }
      }),
      // 2024-2025 Semesters
      prisma.semester.create({
        data: {
          name: 'First Semester 2024-2025',
          nameAr: 'الفصل الدراسي الأول 2024-2025',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31'),
          status: 'ACTIVE',
          days: 90,
          completedDays: 45,
          isActive: true,
          academicYearId: academicYears[2].id
        }
      }),
      prisma.semester.create({
        data: {
          name: 'Second Semester 2024-2025',
          nameAr: 'الفصل الدراسي الثاني 2024-2025',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-06-30'),
          status: 'PLANNING',
          days: 90,
          completedDays: 0,
          isActive: false,
          academicYearId: academicYears[2].id
        }
      })
    ]);

    // 3. Create Users (Base table for all roles)
    console.log('👥 Creating users...');
    const users = await Promise.all([
      // Admin
      prisma.user.upsert({
        where: { email: 'admin@school.com' },
        update: {},
        create: {
          email: 'admin@school.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+1234567890',
          address: 'School Administrative Office',
          avatar: '/avatars/admin.jpg'
        }
      }),
      // Teachers
      prisma.user.upsert({
        where: { email: 'teacher1@school.com' },
        update: {},
        create: {
          email: 'teacher1@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'Ahmed',
          lastName: 'Mohammed',
          phone: '+1234567891',
          address: '123 Teacher Street, City, Country',
          avatar: '/avatars/teacher1.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher2@school.com' },
        update: {},
        create: {
          email: 'teacher2@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'Fatima',
          lastName: 'Ali',
          phone: '+1234567892',
          address: '456 Teacher Avenue, City, Country',
          avatar: '/avatars/teacher2.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher3@school.com' },
        update: {},
        create: {
          email: 'teacher3@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'Omar',
          lastName: 'Hassan',
          phone: '+1234567893',
          address: '789 Teacher Road, City, Country',
          avatar: '/avatars/teacher3.jpg'
        }
      }),
      // Template Teacher Account
      prisma.user.upsert({
        where: { email: 'teacher@school.com' },
        update: {},
        create: {
          email: 'teacher@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          address: '456 Education Street, City, Country',
          avatar: '/avatars/teacher.jpg'
        }
      }),
      // Students
      prisma.user.upsert({
        where: { email: 'student1@school.com' },
        update: {},
        create: {
          email: 'student1@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'Alice',
          lastName: 'Johnson',
          phone: '+1234567894',
          address: '111 Student Lane, City, Country',
          avatar: '/avatars/student1.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student2@school.com' },
        update: {},
        create: {
          email: 'student2@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'Bob',
          lastName: 'Smith',
          phone: '+1234567895',
          address: '222 Student Street, City, Country',
          avatar: '/avatars/student2.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student3@school.com' },
        update: {},
        create: {
          email: 'student3@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'Charlie',
          lastName: 'Brown',
          phone: '+1234567896',
          address: '333 Student Avenue, City, Country',
          avatar: '/avatars/student3.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student4@school.com' },
        update: {},
        create: {
          email: 'student4@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'Diana',
          lastName: 'Wilson',
          phone: '+1234567897',
          address: '444 Student Road, City, Country',
          avatar: '/avatars/student4.jpg'
        }
      }),
      // Template Student Account
      prisma.user.upsert({
        where: { email: 'student@school.com' },
        update: {},
        create: {
          email: 'student@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1234567890',
          address: '123 Learning Street, City, Country',
          avatar: '/avatars/student.jpg'
        }
      }),
      // Parents
      prisma.user.upsert({
        where: { email: 'parent1@school.com' },
        update: {},
        create: {
          email: 'parent1@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'Robert',
          lastName: 'Johnson',
          phone: '+1234567898',
          address: '111 Parent Lane, City, Country',
          avatar: '/avatars/parent1.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent2@school.com' },
        update: {},
        create: {
          email: 'parent2@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'Sarah',
          lastName: 'Smith',
          phone: '+1234567899',
          address: '222 Parent Street, City, Country',
          avatar: '/avatars/parent2.jpg'
        }
      }),
      // Template Parent Account
      prisma.user.upsert({
        where: { email: 'parent@school.com' },
        update: {},
        create: {
          email: 'parent@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'Michael',
          lastName: 'Brown',
          phone: '+1234567890',
          address: '456 Family Avenue, City, Country',
          avatar: '/avatars/parent.jpg'
        }
      })
    ]);

    // 4. Create Role-specific records
    console.log('🎓 Creating role-specific records...');

    // Admin record
    await prisma.admin.upsert({
      where: { userId: users[0].id },
      update: {},
      create: {
        userId: users[0].id,
        permissions: {
          canManageUsers: true,
          canManageClasses: true,
          canViewReports: true,
          canManageSystem: true,
          canManageAnnouncements: true,
          canManageEvents: true
        }
      }
    });

    // Teacher records
    const teachers = await Promise.all([
      prisma.teacher.upsert({
        where: { userId: users[1].id },
        update: {},
        create: {
          userId: users[1].id,
          employeeId: 'T001',
          department: 'Mathematics',
          qualification: 'Master of Mathematics',
          experience: 8,
          salary: 45000.00,
          joinDate: new Date('2020-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[2].id },
        update: {},
        create: {
          userId: users[2].id,
          employeeId: 'T002',
          department: 'Science',
          qualification: 'Master of Science',
          experience: 6,
          salary: 42000.00,
          joinDate: new Date('2021-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[3].id },
        update: {},
        create: {
          userId: users[3].id,
          employeeId: 'T003',
          department: 'English',
          qualification: 'Bachelor of English Literature',
          experience: 5,
          salary: 38000.00,
          joinDate: new Date('2022-09-01')
        }
      }),
      // Template Teacher Account
      prisma.teacher.upsert({
        where: { userId: users[4].id },
        update: {},
        create: {
          userId: users[4].id,
          employeeId: 'T004',
          department: 'General Education',
          qualification: 'Bachelor of Education',
          experience: 3,
          salary: 35000.00,
          joinDate: new Date('2023-09-01')
        }
      })
    ]);

    // Student records
    const students = await Promise.all([
      prisma.student.upsert({
        where: { userId: users[4].id },
        update: {},
        create: {
          userId: users[4].id,
          studentId: 'STU001',
          rollNumber: '001',
          dateOfBirth: new Date('2015-05-15'),
          bloodGroup: 'A+',
          emergencyContact: '+1234567890',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[5].id },
        update: {},
        create: {
          userId: users[5].id,
          studentId: 'STU002',
          rollNumber: '002',
          dateOfBirth: new Date('2015-03-20'),
          bloodGroup: 'B+',
          emergencyContact: '+1234567891',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[6].id },
        update: {},
        create: {
          userId: users[6].id,
          studentId: 'STU003',
          rollNumber: '003',
          dateOfBirth: new Date('2015-07-10'),
          bloodGroup: 'O+',
          emergencyContact: '+1234567892',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[7].id },
        update: {},
        create: {
          userId: users[7].id,
          studentId: 'STU004',
          rollNumber: '004',
          dateOfBirth: new Date('2015-01-25'),
          bloodGroup: 'AB+',
          emergencyContact: '+1234567893',
          admissionDate: new Date('2023-09-01')
        }
      }),
      // Template Student Account
      prisma.student.upsert({
        where: { userId: users[9].id },
        update: {},
        create: {
          userId: users[9].id,
          studentId: 'STU005',
          rollNumber: '005',
          dateOfBirth: new Date('2015-09-15'),
          bloodGroup: 'A-',
          emergencyContact: '+1234567890',
          admissionDate: new Date('2023-09-01')
        }
      })
    ]);

    // Parent records
    const parents = await Promise.all([
      prisma.parent.upsert({
        where: { userId: users[10].id },
        update: {},
        create: {
          userId: users[10].id,
          occupation: 'Software Engineer'
        }
      }),
      prisma.parent.upsert({
        where: { userId: users[11].id },
        update: {},
        create: {
          userId: users[11].id,
          occupation: 'Teacher'
        }
      }),
      // Template Parent Account
      prisma.parent.upsert({
        where: { userId: users[12].id },
        update: {},
        create: {
          userId: users[12].id,
          occupation: 'Business Owner'
        }
      })
    ]);

    // 5. Create Classrooms
    console.log('🏫 Creating classrooms...');
    const classrooms = await Promise.all([
      prisma.classRoom.upsert({
        where: {
          gradeLevelId_sectionNumber_academicYearId: {
            gradeLevelId: gradeLevels[0].id,
            sectionNumber: 1,
            academicYearId: academicYears[2].id
          }
        },
        update: {},
        create: {
          name: 'Grade 1 - Section A',
          nameAr: 'الصف الأول - الشعبة أ',
          section: 'أ',
          sectionNumber: 1,
          gradeLevelId: gradeLevels[0].id,
          classTeacherId: teachers[0].id,
          roomNumber: '101',
          floor: 1,
          capacity: 30,
          facilities: ['Whiteboard', 'Projector', 'Computers'],
          academicYearId: academicYears[2].id,
          isActive: true
        }
      }),
      prisma.classRoom.upsert({
        where: {
          gradeLevelId_sectionNumber_academicYearId: {
            gradeLevelId: gradeLevels[0].id,
            sectionNumber: 2,
            academicYearId: academicYears[2].id
          }
        },
        update: {},
        create: {
          name: 'Grade 1 - Section B',
          nameAr: 'الصف الأول - الشعبة ب',
          section: 'ب',
          sectionNumber: 2,
          gradeLevelId: gradeLevels[0].id,
          classTeacherId: teachers[1].id,
          roomNumber: '102',
          floor: 1,
          capacity: 30,
          facilities: ['Whiteboard', 'Projector', 'Computers'],
          academicYearId: academicYears[2].id,
          isActive: true
        }
      }),
      prisma.classRoom.upsert({
        where: {
          gradeLevelId_sectionNumber_academicYearId: {
            gradeLevelId: gradeLevels[1].id,
            sectionNumber: 1,
            academicYearId: academicYears[2].id
          }
        },
        update: {},
        create: {
          name: 'Grade 2 - Section A',
          nameAr: 'الصف الثاني - الشعبة أ',
          section: 'أ',
          sectionNumber: 1,
          gradeLevelId: gradeLevels[1].id,
          classTeacherId: teachers[2].id,
          roomNumber: '201',
          floor: 2,
          capacity: 30,
          facilities: ['Whiteboard', 'Projector', 'Computers'],
          academicYearId: academicYears[2].id,
          isActive: true
        }
      })
    ]);

    // 6. Create Special Locations
    console.log('🏢 Creating special locations...');
    const specialLocations = await Promise.all([
      prisma.specialLocation.upsert({
        where: { name: 'Science Laboratory' },
        update: {},
        create: {
          name: 'Science Laboratory',
          nameAr: 'مختبر العلوم',
          type: 'LABORATORY',
          floor: 1,
          capacity: 25,
          facilities: ['Microscopes', 'Chemicals', 'Bunsen burners', 'Safety equipment'],
          description: 'Fully equipped science laboratory for experiments',
          isActive: true
        }
      }),
      prisma.specialLocation.upsert({
        where: { name: 'Computer Lab' },
        update: {},
        create: {
          name: 'Computer Lab',
          nameAr: 'مختبر الحاسوب',
          type: 'COMPUTER_LAB',
          floor: 2,
          capacity: 30,
          facilities: ['Computers', 'Printers', 'Projector', 'Internet access'],
          description: 'Computer laboratory with modern equipment',
          isActive: true
        }
      }),
      prisma.specialLocation.upsert({
        where: { name: 'Gymnasium' },
        update: {},
        create: {
          name: 'Gymnasium',
          nameAr: 'الصالة الرياضية',
          type: 'GYMNASIUM',
          floor: 0,
          capacity: 100,
          facilities: ['Basketball court', 'Volleyball nets', 'Exercise equipment'],
          description: 'Sports facility for physical education',
          isActive: true
        }
      })
    ]);

    // 7. Assign students to classrooms
    console.log('📝 Assigning students to classrooms...');
    await Promise.all([
      prisma.student.update({
        where: { id: students[0].id },
        data: { classRoomId: classrooms[0].id }
      }),
      prisma.student.update({
        where: { id: students[1].id },
        data: { classRoomId: classrooms[0].id }
      }),
      prisma.student.update({
        where: { id: students[2].id },
        data: { classRoomId: classrooms[1].id }
      }),
      prisma.student.update({
        where: { id: students[3].id },
        data: { classRoomId: classrooms[2].id }
      }),
      // Assign template student to a classroom
      prisma.student.update({
        where: { id: students[4].id },
        data: { classRoomId: classrooms[0].id }
      })
    ]);

    // 8. Create Parent-Student Relationships
    console.log('👨‍👩‍👧‍👦 Creating parent-student relationships...');
    await Promise.all([
      prisma.studentParent.upsert({
        where: {
          studentId_parentId: {
            studentId: students[0].id,
            parentId: parents[0].id
          }
        },
        update: {},
        create: {
          studentId: students[0].id,
          parentId: parents[0].id,
          relationship: 'Father'
        }
      }),
      prisma.studentParent.upsert({
        where: {
          studentId_parentId: {
            studentId: students[1].id,
            parentId: parents[1].id
          }
        },
        update: {},
        create: {
          studentId: students[1].id,
          parentId: parents[1].id,
          relationship: 'Mother'
        }
      }),
      prisma.studentParent.upsert({
        where: {
          studentId_parentId: {
            studentId: students[2].id,
            parentId: parents[0].id
          }
        },
        update: {},
        create: {
          studentId: students[2].id,
          parentId: parents[0].id,
          relationship: 'Father'
        }
      })
    ]);

    // 9. Create Grade-Subject Relationships
    console.log('📚 Creating grade-subject relationships...');
    await Promise.all([
      // Grade 1 subjects
      prisma.gradeSubject.upsert({
        where: {
          gradeLevelId_subjectId: {
            gradeLevelId: gradeLevels[0].id,
            subjectId: subjects[0].id // Math
          }
        },
        update: {},
        create: {
          gradeLevelId: gradeLevels[0].id,
          subjectId: subjects[0].id,
          isRequired: true,
          weeklyHours: 5
        }
      }),
      prisma.gradeSubject.upsert({
        where: {
          gradeLevelId_subjectId: {
            gradeLevelId: gradeLevels[0].id,
            subjectId: subjects[1].id // Science
          }
        },
        update: {},
        create: {
          gradeLevelId: gradeLevels[0].id,
          subjectId: subjects[1].id,
          isRequired: true,
          weeklyHours: 4
        }
      }),
      prisma.gradeSubject.upsert({
        where: {
          gradeLevelId_subjectId: {
            gradeLevelId: gradeLevels[0].id,
            subjectId: subjects[2].id // English
          }
        },
        update: {},
        create: {
          gradeLevelId: gradeLevels[0].id,
          subjectId: subjects[2].id,
          isRequired: true,
          weeklyHours: 4
        }
      }),
      prisma.gradeSubject.upsert({
        where: {
          gradeLevelId_subjectId: {
            gradeLevelId: gradeLevels[0].id,
            subjectId: subjects[3].id // Arabic
          }
        },
        update: {},
        create: {
          gradeLevelId: gradeLevels[0].id,
          subjectId: subjects[3].id,
          isRequired: true,
          weeklyHours: 4
        }
      })
    ]);

    // 10. Create Teacher-Subject Relationships
    console.log('👨‍🏫 Creating teacher-subject relationships...');
    await Promise.all([
      prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: teachers[0].id,
            subjectId: subjects[0].id // Math teacher
          }
        },
        update: {},
        create: {
          teacherId: teachers[0].id,
          subjectId: subjects[0].id,
          isPrimary: true
        }
      }),
      prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: teachers[1].id,
            subjectId: subjects[1].id // Science teacher
          }
        },
        update: {},
        create: {
          teacherId: teachers[1].id,
          subjectId: subjects[1].id,
          isPrimary: true
        }
      }),
      prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: teachers[2].id,
            subjectId: subjects[2].id // English teacher
          }
        },
        update: {},
        create: {
          teacherId: teachers[2].id,
          subjectId: subjects[2].id,
          isPrimary: true
        }
      })
    ]);

    // 11. Create Time Slots
    console.log('⏰ Creating time slots...');
    const timeSlots = await Promise.all([
      prisma.timeSlot.upsert({
        where: { slotOrder: 1 },
        update: {},
        create: {
          name: 'Period 1',
          nameAr: 'الحصة الأولى',
          startTime: '08:00',
          endTime: '08:45',
          slotOrder: 1,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.upsert({
        where: { slotOrder: 2 },
        update: {},
        create: {
          name: 'Period 2',
          nameAr: 'الحصة الثانية',
          startTime: '08:50',
          endTime: '09:35',
          slotOrder: 2,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.upsert({
        where: { slotOrder: 3 },
        update: {},
        create: {
          name: 'Break',
          nameAr: 'الراحة',
          startTime: '09:35',
          endTime: '09:50',
          slotOrder: 3,
          slotType: 'BREAK',
          duration: 15,
          isActive: true
        }
      }),
      prisma.timeSlot.upsert({
        where: { slotOrder: 4 },
        update: {},
        create: {
          name: 'Period 3',
          nameAr: 'الحصة الثالثة',
          startTime: '09:50',
          endTime: '10:35',
          slotOrder: 4,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.upsert({
        where: { slotOrder: 5 },
        update: {},
        create: {
          name: 'Period 4',
          nameAr: 'الحصة الرابعة',
          startTime: '10:40',
          endTime: '11:25',
          slotOrder: 5,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.upsert({
        where: { slotOrder: 6 },
        update: {},
        create: {
          name: 'Lunch Break',
          nameAr: 'راحة الغداء',
          startTime: '11:25',
          endTime: '12:10',
          slotOrder: 6,
          slotType: 'LUNCH',
          duration: 45,
          isActive: true
        }
      })
    ]);

    // 12. Create Timetable Entries
    console.log('📅 Creating timetable entries...');
    await Promise.all([
      // Monday schedule for Grade 1 Section A
      prisma.timetable.create({
        data: {
          classRoomId: classrooms[0].id,
          subjectId: subjects[0].id, // Math
          teacherId: teachers[0].id,
          timeSlotId: timeSlots[0].id,
          dayOfWeek: 1,
          slotType: 'LESSON',
          notes: 'Mathematics class',
          isActive: true
        }
      }),
      prisma.timetable.create({
        data: {
          classRoomId: classrooms[0].id,
          subjectId: subjects[1].id, // Science
          teacherId: teachers[1].id,
          timeSlotId: timeSlots[1].id,
          dayOfWeek: 1,
          slotType: 'LESSON',
          notes: 'Science class',
          isActive: true
        }
      }),
      prisma.timetable.create({
        data: {
          classRoomId: classrooms[0].id,
          subjectId: subjects[2].id, // English
          teacherId: teachers[2].id,
          timeSlotId: timeSlots[3].id,
          dayOfWeek: 1,
          slotType: 'LESSON',
          notes: 'English class',
          isActive: true
        }
      })
    ]);

    // 13. Create Attendance Records
    console.log('📊 Creating comprehensive attendance records...');

    // Clear existing attendance first
    await prisma.attendance.deleteMany({});

    console.log('📝 Creating assignments...');
    const assignments = await Promise.all([
      prisma.assignment.create({
        data: {
          title: 'Mathematics Homework - Addition',
          description: 'Complete addition exercises from page 15-20',
          classRoomId: classrooms[0].id,
          subjectId: subjects[0].id,
          teacherId: teachers[0].id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          totalMarks: 20.0,
          instructions: 'Show all your work. Use the addition method we learned in class.',
          attachments: ['/assignments/math_homework_1.pdf'],
          isActive: true
        }
      }),
      prisma.assignment.create({
        data: {
          title: 'Science Experiment Report',
          description: 'Write a report about the water cycle experiment',
          classRoomId: classrooms[0].id,
          subjectId: subjects[1].id,
          teacherId: teachers[1].id,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          totalMarks: 25.0,
          instructions: 'Include observations, results, and conclusions. Use proper scientific format.',
          attachments: ['/assignments/science_experiment_guide.pdf'],
          isActive: true
        }
      })
    ]);

    // 15. Create Assignment Submissions
    console.log('📤 Creating assignment submissions...');
    await Promise.all([
      prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignments[0].id,
            studentId: students[0].id
          }
        },
        update: {},
        create: {
          assignmentId: assignments[0].id,
          studentId: students[0].id,
          content: 'Completed all addition exercises. Attached my work.',
          attachments: ['/submissions/student1_math_homework.pdf'],
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          marksObtained: 18.0,
          feedback: 'Excellent work! Keep it up.',
          gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          gradedById: teachers[0].id
        }
      }),
      prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignments[1].id,
            studentId: students[1].id
          }
        },
        update: {},
        create: {
          assignmentId: assignments[1].id,
          studentId: students[1].id,
          content: 'Science experiment report completed.',
          attachments: ['/submissions/student2_science_report.pdf'],
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          marksObtained: 22.0,
          feedback: 'Good observations and conclusions.',
          gradedAt: new Date(),
          gradedById: teachers[1].id
        }
      })
    ]);

    // 16. Create Exams
    console.log('📋 Creating exams...');
    const exams = await Promise.all([
      prisma.exam.create({
        data: {
          title: 'Mathematics Midterm Exam',
          description: 'Midterm examination covering chapters 1-5',
          classRoomId: classrooms[0].id,
          subjectId: subjects[0].id,
          teacherId: teachers[0].id,
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          duration: 90,
          totalMarks: 100.0,
          instructions: 'Bring your calculator. Show all working steps.',
          isActive: true
        }
      }),
      prisma.exam.create({
        data: {
          title: 'Science Final Exam',
          description: 'Final examination covering all science topics',
          classRoomId: classrooms[0].id,
          subjectId: subjects[1].id,
          teacherId: teachers[1].id,
          examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          duration: 120,
          totalMarks: 100.0,
          instructions: 'This is a comprehensive exam. Answer all questions.',
          isActive: true
        }
      })
    ]);

    // 17. Create Exam Results
    console.log('📊 Creating exam results...');
    await Promise.all([
      prisma.examResult.upsert({
        where: {
          examId_studentId: {
            examId: exams[0].id,
            studentId: students[0].id
          }
        },
        update: {},
        create: {
          examId: exams[0].id,
          studentId: students[0].id,
          marksObtained: 85.0,
          grade: 'A',
          remarks: 'Excellent performance'
        }
      }),
      prisma.examResult.upsert({
        where: {
          examId_studentId: {
            examId: exams[0].id,
            studentId: students[1].id
          }
        },
        update: {},
        create: {
          examId: exams[0].id,
          studentId: students[1].id,
          marksObtained: 78.0,
          grade: 'B+',
          remarks: 'Good work, needs improvement in algebra'
        }
      })
    ]);

    // 18. Create Grades
    console.log('🎓 Creating comprehensive grades for all students...');

    // Clear existing grades first
    await prisma.grade.deleteMany({});

    const gradeRecords = [];

    // Create grades for ALL students in ALL subjects with realistic distribution
    for (const student of students) {
      for (const subject of subjects) {
        // Create 2-4 grades per student per subject
        const numGrades = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < numGrades; i++) {
          // Realistic grade distribution:
          // 20% A+ (90-100), 50% passing (60-89), 30% at risk (0-59)
          let marks;
          const rand = Math.random();

          if (rand < 0.20) {
            // A+ students: 90-100
            marks = Math.floor(Math.random() * 11) + 90;
          } else if (rand < 0.70) {
            // Passing students: 60-89
            marks = Math.floor(Math.random() * 30) + 60;
          } else {
            // At risk students: 0-59
            marks = Math.floor(Math.random() * 60);
          }

          gradeRecords.push({
            studentId: student.id,
            subjectId: subject.id,
            marks: marks,
            totalMarks: 100,
            examType: i === 0 ? 'Midterm' : i === 1 ? 'Quiz' : 'Final',
            examDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
          });
        }
      }
    }

    console.log(`📊 Creating ${gradeRecords.length} grade records...`);
    await prisma.grade.createMany({
      data: gradeRecords
    });

    // 19. Create Attendance Records
    console.log('📊 Creating attendance records...');

    // Clear existing attendance first (already done above)
    const attendanceRecords = [];
    
    // Create attendance for the last 30 days for all students
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      for (const student of students) {
        // Random attendance status with 90% present rate
        const isPresent = Math.random() < 0.9;
        const status = isPresent ? 'PRESENT' : (Math.random() < 0.7 ? 'ABSENT' : Math.random() < 0.5 ? 'LATE' : 'EXCUSED');
        
        attendanceRecords.push({
          studentId: student.id,
          teacherId: teachers[0]?.id || teachers[0].userId, // Use first teacher
          classRoomId: student.classRoomId || classrooms[0].id,
          date: date,
          status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', // Cast to AttendanceStatus
          remarks: status === 'LATE' ? 'Arrived 15 minutes late' : status === 'EXCUSED' ? 'Medical appointment' : null
        });
      }
    }
    
    await prisma.attendance.createMany({
      data: attendanceRecords
    });

    // 20. Create Events
    console.log('📅 Creating events...');
    const currentDate = new Date();
    await Promise.all([
      prisma.event.create({
        data: {
          title: 'يوم المدرسة السنوي',
          description: 'احتفال المدرسة السنوي مع العروض والجوائز',
          eventDate: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          eventTime: '10:00',
          location: 'قاعة المدرسة',
          type: 'GENERAL',
          createdById: users[0].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'اجتماع أولياء الأمور والمعلمين',
          description: 'اجتماع لمناقشة تقدم الطلاب وأدائهم',
          eventDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          eventTime: '14:00',
          location: 'الفصل 101',
          type: 'MEETING',
          createdById: users[0].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'معرض العلوم',
          description: 'معرض العلوم السنوي لعرض مشاريع الطلاب',
          eventDate: new Date(currentDate.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
          eventTime: '09:00',
          location: 'الصالة الرياضية للمدرسة',
          type: 'ACADEMIC',
          createdById: users[1].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'يوم الرياضة',
          description: 'المسابقة الرياضية السنوية بين الفصول',
          eventDate: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          eventTime: '08:00',
          location: 'ملعب المدرسة',
          type: 'SPORTS',
          createdById: users[1].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'المهرجان الثقافي',
          description: 'احتفال بالثقافات المتنوعة مع العروض التقليدية',
          eventDate: new Date(currentDate.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
          eventTime: '16:00',
          location: 'قاعة المدرسة',
          type: 'CULTURAL',
          createdById: users[2].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'امتحانات منتصف الفصل',
          description: 'امتحانات منتصف الفصل لجميع الصفوف',
          eventDate: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          eventTime: '09:00',
          location: 'قاعات الامتحانات',
          type: 'EXAM',
          createdById: users[0].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'عطلة الشتاء',
          description: 'إغلاق المدرسة لعطلة الشتاء',
          eventDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          eventTime: null,
          location: 'حرم المدرسة',
          type: 'HOLIDAY',
          createdById: users[0].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'معرض الفنون',
          description: 'معرض فنون الطلاب لعرض الأعمال الإبداعية',
          eventDate: new Date(currentDate.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
          eventTime: '11:00',
          location: 'معرض الفنون',
          type: 'CULTURAL',
          createdById: users[2].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'ندوة التوجيه المهني',
          description: 'ندوة حول فرص العمل والتخطيط للمستقبل',
          eventDate: new Date(currentDate.getTime() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
          eventTime: '13:00',
          location: 'غرفة المؤتمرات',
          type: 'MEETING',
          createdById: users[0].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'أولمبياد الرياضيات',
          description: 'المسابقة السنوية في الرياضيات للطلاب الموهوبين',
          eventDate: new Date(currentDate.getTime() + 22 * 24 * 60 * 60 * 1000), // 22 days from now
          eventTime: '08:30',
          location: 'مختبر الرياضيات',
          type: 'ACADEMIC',
          createdById: users[1].id
        }
      })
    ]);

    // 20. Create Announcements
    console.log('📢 Creating announcements...');
    await Promise.all([
      prisma.announcement.create({
        data: {
          title: 'إشعار إجازة المدرسة',
          content: 'سيتم إغلاق المدرسة لإجازة الشتاء من 20 ديسمبر إلى 5 يناير. ستستأنف الدراسة في 6 يناير.',
          targetRoles: ['ALL'],
          priority: 'HIGH',
          isActive: true,
          expiresAt: new Date('2025-12-20'),
          createdById: users[0].id
        }
      }),
      prisma.announcement.create({
        data: {
          title: 'كتب جديدة متاحة في المكتبة',
          content: 'تم إضافة مجموعة جديدة من الكتب إلى مكتبة المدرسة. يشجع الطلاب على زيارة المكتبة واستعارة الكتب.',
          targetRoles: ['STUDENTS', 'TEACHERS'],
          priority: 'NORMAL',
          isActive: true,
          expiresAt: new Date('2025-11-30'),
          createdById: users[1].id
        }
      }),
      prisma.announcement.create({
        data: {
          title: 'تجارب الرياضة',
          content: 'سيتم إجراء تجارب كرة القدم وكرة السلة الأسبوع المقبل. يجب على الطلاب المهتمين التوجه إلى الصالة الرياضية.',
          targetRoles: ['STUDENTS'],
          priority: 'NORMAL',
          isActive: true,
          expiresAt: new Date('2025-11-15'),
          createdById: users[2].id
        }
      })
    ]);

    console.log('✅ Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${gradeLevels.length} grade levels created`);
    console.log(`- ${subjects.length} subjects created`);
    console.log(`- ${users.length} users created`);
    console.log(`- ${teachers.length} teachers created`);
    console.log(`- ${students.length} students created`);
    console.log(`- ${parents.length} parents created`);
    console.log(`- ${classrooms.length} classrooms created`);
    console.log(`- ${specialLocations.length} special locations created`);
    console.log(`- ${timeSlots.length} time slots created`);
    console.log(`- ${assignments.length} assignments created`);
    console.log(`- ${exams.length} exams created`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });