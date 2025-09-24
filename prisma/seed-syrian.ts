import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Syrian Arabic database seed...');

  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Create Grade Levels (المراحل الدراسية)
    console.log('📚 Creating grade levels...');
    const gradeLevels = await Promise.all([
      prisma.gradeLevel.upsert({
        where: { level: 1 },
        update: {},
        create: {
          name: 'Grade 1',
          nameAr: 'الصف الأول الابتدائي',
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
          nameAr: 'الصف الثاني الابتدائي',
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
          nameAr: 'الصف الثالث الابتدائي',
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
          nameAr: 'الصف الرابع الابتدائي',
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
          nameAr: 'الصف الخامس الابتدائي',
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
          nameAr: 'الصف السادس الابتدائي',
          level: 6,
          description: 'Sixth grade - Primary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 7 },
        update: {},
        create: {
          name: 'Grade 7',
          nameAr: 'الصف الأول الإعدادي',
          level: 7,
          description: 'Seventh grade - Preparatory School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 8 },
        update: {},
        create: {
          name: 'Grade 8',
          nameAr: 'الصف الثاني الإعدادي',
          level: 8,
          description: 'Eighth grade - Preparatory School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 9 },
        update: {},
        create: {
          name: 'Grade 9',
          nameAr: 'الصف الثالث الإعدادي',
          level: 9,
          description: 'Ninth grade - Preparatory School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 10 },
        update: {},
        create: {
          name: 'Grade 10',
          nameAr: 'الصف الأول الثانوي',
          level: 10,
          description: 'Tenth grade - Secondary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 11 },
        update: {},
        create: {
          name: 'Grade 11',
          nameAr: 'الصف الثاني الثانوي',
          level: 11,
          description: 'Eleventh grade - Secondary School',
          isActive: true
        }
      }),
      prisma.gradeLevel.upsert({
        where: { level: 12 },
        update: {},
        create: {
          name: 'Grade 12',
          nameAr: 'الصف الثالث الثانوي',
          level: 12,
          description: 'Twelfth grade - Secondary School',
          isActive: true
        }
      })
    ]);

    // 2. Create Subjects (المواد الدراسية)
    console.log('📖 Creating subjects...');
    const subjects = await Promise.all([
      prisma.subject.upsert({
        where: { code: 'ARABIC' },
        update: {},
        create: {
          name: 'Arabic Language',
          nameAr: 'اللغة العربية',
          code: 'ARABIC',
          description: 'Arabic language and literature',
          color: '#96CEB4',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'MATH' },
        update: {},
        create: {
          name: 'Mathematics',
          nameAr: 'الرياضيات',
          code: 'MATH',
          description: 'Mathematics covering arithmetic, algebra, and geometry',
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
          description: 'Science covering physics, chemistry, and biology',
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
        where: { code: 'FRENCH' },
        update: {},
        create: {
          name: 'French',
          nameAr: 'الفرنسية',
          code: 'FRENCH',
          description: 'French language',
          color: '#A8E6CF',
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
        where: { code: 'PHYSICS' },
        update: {},
        create: {
          name: 'Physics',
          nameAr: 'الفيزياء',
          code: 'PHYSICS',
          description: 'Physics and physical sciences',
          color: '#74B9FF',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'CHEMISTRY' },
        update: {},
        create: {
          name: 'Chemistry',
          nameAr: 'الكيمياء',
          code: 'CHEMISTRY',
          description: 'Chemistry and chemical sciences',
          color: '#A29BFE',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'BIOLOGY' },
        update: {},
        create: {
          name: 'Biology',
          nameAr: 'الأحياء',
          code: 'BIOLOGY',
          description: 'Biology and life sciences',
          color: '#55EFC4',
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
      }),
      prisma.subject.upsert({
        where: { code: 'ISLAMIC_STUDIES' },
        update: {},
        create: {
          name: 'Islamic Studies',
          nameAr: 'التربية الإسلامية',
          code: 'ISLAMIC_STUDIES',
          description: 'Islamic studies and religious education',
          color: '#00B894',
          isActive: true
        }
      }),
      prisma.subject.upsert({
        where: { code: 'CIVICS' },
        update: {},
        create: {
          name: 'Civics',
          nameAr: 'التربية الوطنية',
          code: 'CIVICS',
          description: 'Civics and national education',
          color: '#E17055',
          isActive: true
        }
      })
    ]);

    // 3. Create Academic Years (السنوات الدراسية)
    console.log('📅 Creating academic years...');
    const academicYears = await Promise.all([
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
          color: '#666666'
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
          completedDays: 90,
          color: '#1976d2'
        }
      }),
      prisma.academicYear.upsert({
        where: { name: '2025-2026' },
        update: {},
        create: {
          name: '2025-2026',
          nameAr: '2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2026-06-30'),
          status: 'PLANNING',
          isActive: false,
          totalDays: 180,
          completedDays: 0,
          color: '#2E7D32'
        }
      })
    ]);

    // 4. Create Semesters (الفصول الدراسية)
    console.log('📅 Creating semesters...');
    const semesters = await Promise.all([
      // 2023-2024 Academic Year
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
          academicYearId: academicYears[0].id
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
          academicYearId: academicYears[0].id
        }
      }),
      // 2024-2025 Academic Year
      prisma.semester.create({
        data: {
          name: 'First Semester 2024-2025',
          nameAr: 'الفصل الدراسي الأول 2024-2025',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31'),
          status: 'COMPLETED',
          days: 90,
          completedDays: 90,
          isActive: false,
          academicYearId: academicYears[1].id
        }
      }),
      prisma.semester.create({
        data: {
          name: 'Second Semester 2024-2025',
          nameAr: 'الفصل الدراسي الثاني 2024-2025',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-06-30'),
          status: 'ACTIVE',
          days: 90,
          completedDays: 45,
          isActive: true,
          academicYearId: academicYears[1].id
        }
      }),
      // 2025-2026 Academic Year
      prisma.semester.create({
        data: {
          name: 'First Semester 2025-2026',
          nameAr: 'الفصل الدراسي الأول 2025-2026',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-12-31'),
          status: 'PLANNING',
          days: 90,
          completedDays: 0,
          isActive: false,
          academicYearId: academicYears[2].id
        }
      })
    ]);

    // 5. Create Users with Syrian Arabic names (المستخدمون)
    console.log('👥 Creating users with Syrian Arabic names...');
    const users = await Promise.all([
      // Admin (المدير)
      prisma.user.upsert({
        where: { email: 'admin@school.com' },
        update: {},
        create: {
          email: 'admin@school.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          firstName: 'أحمد',
          lastName: 'الحسن',
          phone: '+963-11-1234567',
          address: 'دمشق، المزة، شارع الثورة',
          avatar: '/avatars/admin.jpg'
        }
      }),

      // Teachers (المعلمون)
      prisma.user.upsert({
        where: { email: 'teacher1@school.com' },
        update: {},
        create: {
          email: 'teacher1@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'فاطمة',
          lastName: 'الزهراء',
          phone: '+963-11-2345678',
          address: 'دمشق، المهاجرين، شارع 29 أيار',
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
          firstName: 'محمد',
          lastName: 'علي',
          phone: '+963-11-3456789',
          address: 'دمشق، كفرسوسة، شارع الوحدة',
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
          firstName: 'خديجة',
          lastName: 'أحمد',
          phone: '+963-11-4567890',
          address: 'دمشق، الشاغور، شارع بغداد',
          avatar: '/avatars/teacher3.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher4@school.com' },
        update: {},
        create: {
          email: 'teacher4@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'عمر',
          lastName: 'الحسين',
          phone: '+963-11-5678901',
          address: 'دمشق، البرامكة، شارع الجلاء',
          avatar: '/avatars/teacher4.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher5@school.com' },
        update: {},
        create: {
          email: 'teacher5@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'زينب',
          lastName: 'محمد',
          phone: '+963-11-6789012',
          address: 'دمشق، المالكي، شارع فلسطين',
          avatar: '/avatars/teacher5.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher6@school.com' },
        update: {},
        create: {
          email: 'teacher6@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'علي',
          lastName: 'إبراهيم',
          phone: '+963-11-7890123',
          address: 'دمشق، الدويلعة، شارع الأمويين',
          avatar: '/avatars/teacher6.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher7@school.com' },
        update: {},
        create: {
          email: 'teacher7@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'مريم',
          lastName: 'حسن',
          phone: '+963-11-8901234',
          address: 'دمشق، الزاهرة، شارع الثورة',
          avatar: '/avatars/teacher7.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'teacher8@school.com' },
        update: {},
        create: {
          email: 'teacher8@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'حسن',
          lastName: 'عبدالله',
          phone: '+963-11-9012345',
          address: 'دمشق، المهاجرين، شارع 7 نيسان',
          avatar: '/avatars/teacher8.jpg'
        }
      }),

      // Demo Teacher Account (حساب تجريبي للمعلم)
      prisma.user.upsert({
        where: { email: 'teacher@school.com' },
        update: {},
        create: {
          email: 'teacher@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          status: 'ACTIVE',
          firstName: 'أحمد',
          lastName: 'المعلم',
          phone: '+963-11-1234567',
          address: 'دمشق، المدرسة الثانوية',
          avatar: '/avatars/teacher.jpg'
        }
      }),

      // Students (الطلاب)
      prisma.user.upsert({
        where: { email: 'student1@school.com' },
        update: {},
        create: {
          email: 'student1@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'سارة',
          lastName: 'الحسن',
          phone: '+963-11-1122334',
          address: 'دمشق، المزة، حي الروضة',
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
          firstName: 'يوسف',
          lastName: 'علي',
          phone: '+963-11-2233445',
          address: 'دمشق، كفرسوسة، حي الزهور',
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
          firstName: 'لينا',
          lastName: 'أحمد',
          phone: '+963-11-3344556',
          address: 'دمشق، الشاغور، حي الأندلس',
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
          firstName: 'كريم',
          lastName: 'الحسين',
          phone: '+963-11-4455667',
          address: 'دمشق، البرامكة، حي الياسمين',
          avatar: '/avatars/student4.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student5@school.com' },
        update: {},
        create: {
          email: 'student5@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'نور',
          lastName: 'محمد',
          phone: '+963-11-5566778',
          address: 'دمشق، المالكي، حي الرياض',
          avatar: '/avatars/student5.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student6@school.com' },
        update: {},
        create: {
          email: 'student6@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'أحمد',
          lastName: 'إبراهيم',
          phone: '+963-11-6677889',
          address: 'دمشق، الدويلعة، حي الشام',
          avatar: '/avatars/student6.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student7@school.com' },
        update: {},
        create: {
          email: 'student7@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'فاطمة',
          lastName: 'حسن',
          phone: '+963-11-7788990',
          address: 'دمشق، الزاهرة، حي الورود',
          avatar: '/avatars/student7.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student8@school.com' },
        update: {},
        create: {
          email: 'student8@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'محمد',
          lastName: 'عبدالله',
          phone: '+963-11-8899001',
          address: 'دمشق، المهاجرين، حي الزهور',
          avatar: '/avatars/student8.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student9@school.com' },
        update: {},
        create: {
          email: 'student9@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'مريم',
          lastName: 'علي',
          phone: '+963-11-9900112',
          address: 'دمشق، المزة، حي الرياض',
          avatar: '/avatars/student9.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'student10@school.com' },
        update: {},
        create: {
          email: 'student10@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'علي',
          lastName: 'أحمد',
          phone: '+963-11-0011223',
          address: 'دمشق، كفرسوسة، حي الأندلس',
          avatar: '/avatars/student10.jpg'
        }
      }),

      // Demo Student Account (حساب تجريبي للطالب)
      prisma.user.upsert({
        where: { email: 'student@school.com' },
        update: {},
        create: {
          email: 'student@school.com',
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          firstName: 'سارة',
          lastName: 'الطالبة',
          phone: '+963-11-1234567',
          address: 'دمشق، المدرسة الثانوية',
          avatar: '/avatars/student.jpg'
        }
      }),

      // Parents (أولياء الأمور)
      prisma.user.upsert({
        where: { email: 'parent1@school.com' },
        update: {},
        create: {
          email: 'parent1@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'الحسن',
          lastName: 'الحسن',
          phone: '+963-11-1111111',
          address: 'دمشق، المزة، حي الروضة',
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
          firstName: 'فاطمة',
          lastName: 'علي',
          phone: '+963-11-2222222',
          address: 'دمشق، كفرسوسة، حي الزهور',
          avatar: '/avatars/parent2.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent3@school.com' },
        update: {},
        create: {
          email: 'parent3@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'أحمد',
          lastName: 'أحمد',
          phone: '+963-11-3333333',
          address: 'دمشق، الشاغور، حي الأندلس',
          avatar: '/avatars/parent3.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent4@school.com' },
        update: {},
        create: {
          email: 'parent4@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'زينب',
          lastName: 'الحسين',
          phone: '+963-11-4444444',
          address: 'دمشق، البرامكة، حي الياسمين',
          avatar: '/avatars/parent4.jpg'
        }
      }),
      prisma.user.upsert({
        where: { email: 'parent5@school.com' },
        update: {},
        create: {
          email: 'parent5@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'محمد',
          lastName: 'محمد',
          phone: '+963-11-5555555',
          address: 'دمشق، المالكي، حي الرياض',
          avatar: '/avatars/parent5.jpg'
        }
      }),

      // Demo Parent Account (حساب تجريبي للوالد)
      prisma.user.upsert({
        where: { email: 'parent@school.com' },
        update: {},
        create: {
          email: 'parent@school.com',
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          firstName: 'أحمد',
          lastName: 'الوالد',
          phone: '+963-11-1234567',
          address: 'دمشق، المدرسة الثانوية',
          avatar: '/avatars/parent.jpg'
        }
      })
    ]);

    console.log('✅ Users created successfully!');

    // Continue with the rest of the seed data...
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
          department: 'Arabic Language',
          qualification: 'ماجستير في اللغة العربية',
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
          department: 'Mathematics',
          qualification: 'ماجستير في الرياضيات',
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
          qualification: 'بكالوريوس في اللغة الإنجليزية',
          experience: 5,
          salary: 38000.00,
          joinDate: new Date('2022-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[4].id },
        update: {},
        create: {
          userId: users[4].id,
          employeeId: 'T004',
          department: 'Science',
          qualification: 'ماجستير في العلوم',
          experience: 7,
          salary: 43000.00,
          joinDate: new Date('2021-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[5].id },
        update: {},
        create: {
          userId: users[5].id,
          employeeId: 'T005',
          department: 'History',
          qualification: 'ماجستير في التاريخ',
          experience: 9,
          salary: 46000.00,
          joinDate: new Date('2019-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[6].id },
        update: {},
        create: {
          userId: users[6].id,
          employeeId: 'T006',
          department: 'Geography',
          qualification: 'ماجستير في الجغرافيا',
          experience: 4,
          salary: 36000.00,
          joinDate: new Date('2023-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[7].id },
        update: {},
        create: {
          userId: users[7].id,
          employeeId: 'T007',
          department: 'Physical Education',
          qualification: 'بكالوريوس في التربية البدنية',
          experience: 6,
          salary: 35000.00,
          joinDate: new Date('2022-09-01')
        }
      }),
      prisma.teacher.upsert({
        where: { userId: users[8].id },
        update: {},
        create: {
          userId: users[8].id,
          employeeId: 'T008',
          department: 'Art',
          qualification: 'بكالوريوس في الفنون',
          experience: 3,
          salary: 32000.00,
          joinDate: new Date('2024-09-01')
        }
      }),
      // Demo teacher
      prisma.teacher.upsert({
        where: { userId: users[9].id },
        update: {},
        create: {
          userId: users[9].id,
          employeeId: 'T009',
          department: 'Mathematics',
          qualification: 'ماجستير في الرياضيات',
          experience: 5,
          salary: 40000.00,
          joinDate: new Date('2022-09-01')
        }
      })
    ]);

    // Student records
    const students = await Promise.all([
      prisma.student.upsert({
        where: { userId: users[10].id },
        update: {},
        create: {
          userId: users[10].id,
          studentId: 'S001',
          rollNumber: '001',
          dateOfBirth: new Date('2010-05-15'),
          bloodGroup: 'A+',
          emergencyContact: '+963-11-1122334',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[11].id },
        update: {},
        create: {
          userId: users[11].id,
          studentId: 'S002',
          rollNumber: '002',
          dateOfBirth: new Date('2010-03-22'),
          bloodGroup: 'B+',
          emergencyContact: '+963-11-2233445',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[12].id },
        update: {},
        create: {
          userId: users[12].id,
          studentId: 'S003',
          rollNumber: '003',
          dateOfBirth: new Date('2010-07-08'),
          bloodGroup: 'O+',
          emergencyContact: '+963-11-3344556',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[13].id },
        update: {},
        create: {
          userId: users[13].id,
          studentId: 'S004',
          rollNumber: '004',
          dateOfBirth: new Date('2010-01-12'),
          bloodGroup: 'A-',
          emergencyContact: '+963-11-4455667',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[14].id },
        update: {},
        create: {
          userId: users[14].id,
          studentId: 'S005',
          rollNumber: '005',
          dateOfBirth: new Date('2010-09-30'),
          bloodGroup: 'B-',
          emergencyContact: '+963-11-5566778',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[15].id },
        update: {},
        create: {
          userId: users[15].id,
          studentId: 'S006',
          rollNumber: '006',
          dateOfBirth: new Date('2010-11-05'),
          bloodGroup: 'O-',
          emergencyContact: '+963-11-6677889',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[16].id },
        update: {},
        create: {
          userId: users[16].id,
          studentId: 'S007',
          rollNumber: '007',
          dateOfBirth: new Date('2010-04-18'),
          bloodGroup: 'AB+',
          emergencyContact: '+963-11-7788990',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[17].id },
        update: {},
        create: {
          userId: users[17].id,
          studentId: 'S008',
          rollNumber: '008',
          dateOfBirth: new Date('2010-06-25'),
          bloodGroup: 'AB-',
          emergencyContact: '+963-11-8899001',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[18].id },
        update: {},
        create: {
          userId: users[18].id,
          studentId: 'S009',
          rollNumber: '009',
          dateOfBirth: new Date('2010-08-14'),
          bloodGroup: 'A+',
          emergencyContact: '+963-11-9900112',
          admissionDate: new Date('2023-09-01')
        }
      }),
      prisma.student.upsert({
        where: { userId: users[19].id },
        update: {},
        create: {
          userId: users[19].id,
          studentId: 'S010',
          rollNumber: '010',
          dateOfBirth: new Date('2010-02-28'),
          bloodGroup: 'B+',
          emergencyContact: '+963-11-0011223',
          admissionDate: new Date('2023-09-01')
        }
      }),
      // Demo student
      prisma.student.upsert({
        where: { userId: users[20].id },
        update: {},
        create: {
          userId: users[20].id,
          studentId: 'S011',
          rollNumber: '011',
          dateOfBirth: new Date('2010-12-10'),
          bloodGroup: 'O+',
          emergencyContact: '+963-11-1234567',
          admissionDate: new Date('2023-09-01')
        }
      })
    ]);

    // Parent records
    const parents = await Promise.all([
      prisma.parent.upsert({
        where: { userId: users[21].id },
        update: {},
        create: {
          userId: users[21].id,
          occupation: 'مهندس'
        }
      }),
      prisma.parent.upsert({
        where: { userId: users[22].id },
        update: {},
        create: {
          userId: users[22].id,
          occupation: 'معلمة'
        }
      }),
      prisma.parent.upsert({
        where: { userId: users[23].id },
        update: {},
        create: {
          userId: users[23].id,
          occupation: 'طبيب'
        }
      }),
      prisma.parent.upsert({
        where: { userId: users[24].id },
        update: {},
        create: {
          userId: users[24].id,
          occupation: 'محامي'
        }
      }),
      prisma.parent.upsert({
        where: { userId: users[25].id },
        update: {},
        create: {
          userId: users[25].id,
          occupation: 'تاجر'
        }
      }),
      // Demo parent
      prisma.parent.upsert({
        where: { userId: users[26].id },
        update: {},
        create: {
          userId: users[26].id,
          occupation: 'موظف حكومي'
        }
      })
    ]);

    console.log('✅ Role-specific records created successfully!');

    // Continue with creating class rooms, grade subjects, etc.
    console.log('🏫 Creating class rooms and grade subjects...');

    // Create Grade-Subject relationships
    const gradeSubjects = await Promise.all([
      // Grade 1 subjects
      ...gradeLevels.slice(0, 6).flatMap(gradeLevel =>
        subjects.slice(0, 8).map(subject => 
          prisma.gradeSubject.upsert({
            where: { gradeLevelId_subjectId: { gradeLevelId: gradeLevel.id, subjectId: subject.id } },
            update: {},
            create: {
              gradeLevelId: gradeLevel.id,
              subjectId: subject.id,
              isRequired: true,
              weeklyHours: gradeLevel.level <= 3 ? 3 : gradeLevel.level <= 6 ? 4 : 5
            }
          })
        )
      ),
      // Grade 7-9 subjects (Preparatory)
      ...gradeLevels.slice(6, 9).flatMap(gradeLevel =>
        [...subjects.slice(0, 8), subjects[8], subjects[9]].map(subject => 
          prisma.gradeSubject.upsert({
            where: { gradeLevelId_subjectId: { gradeLevelId: gradeLevel.id, subjectId: subject.id } },
            update: {},
            create: {
              gradeLevelId: gradeLevel.id,
              subjectId: subject.id,
              isRequired: true,
              weeklyHours: 5
            }
          })
        )
      ),
      // Grade 10-12 subjects (Secondary)
      ...gradeLevels.slice(9, 12).flatMap(gradeLevel =>
        subjects.map(subject => 
          prisma.gradeSubject.upsert({
            where: { gradeLevelId_subjectId: { gradeLevelId: gradeLevel.id, subjectId: subject.id } },
            update: {},
            create: {
              gradeLevelId: gradeLevel.id,
              subjectId: subject.id,
              isRequired: true,
              weeklyHours: 6
            }
          })
        )
      )
    ]);

    // Create Class Rooms for current academic year (2024-2025)
    const classRooms = await Promise.all([
      // Grade 1 classes
      prisma.classRoom.create({
        data: {
          name: 'الصف الأول الابتدائي - الشعبة الأولى',
          nameAr: 'الصف الأول الابتدائي - الشعبة الأولى',
          section: 'الأولى',
          sectionNumber: 1,
          gradeLevelId: gradeLevels[0].id,
          classTeacherId: teachers[0].id,
          roomNumber: '101',
          floor: 1,
          capacity: 30,
          facilities: ['سبورة', 'مقاعد', 'مكيف'],
          academicYearId: academicYears[1].id,
          semesterId: semesters[3].id,
          isActive: true
        }
      }),
      prisma.classRoom.create({
        data: {
          name: 'الصف الأول الابتدائي - الشعبة الثانية',
          nameAr: 'الصف الأول الابتدائي - الشعبة الثانية',
          section: 'الثانية',
          sectionNumber: 2,
          gradeLevelId: gradeLevels[0].id,
          classTeacherId: teachers[1].id,
          roomNumber: '102',
          floor: 1,
          capacity: 30,
          facilities: ['سبورة', 'مقاعد', 'مكيف'],
          academicYearId: academicYears[1].id,
          semesterId: semesters[3].id,
          isActive: true
        }
      }),
      // Grade 2 classes
      prisma.classRoom.create({
        data: {
          name: 'الصف الثاني الابتدائي - الشعبة الأولى',
          nameAr: 'الصف الثاني الابتدائي - الشعبة الأولى',
          section: 'الأولى',
          sectionNumber: 1,
          gradeLevelId: gradeLevels[1].id,
          classTeacherId: teachers[2].id,
          roomNumber: '201',
          floor: 2,
          capacity: 30,
          facilities: ['سبورة', 'مقاعد', 'مكيف', 'جهاز عرض'],
          academicYearId: academicYears[1].id,
          semesterId: semesters[3].id,
          isActive: true
        }
      }),
      // Grade 10 classes (Secondary)
      prisma.classRoom.create({
        data: {
          name: 'الصف الأول الثانوي - الشعبة العلمية الأولى',
          nameAr: 'الصف الأول الثانوي - الشعبة العلمية الأولى',
          section: 'العلمية الأولى',
          sectionNumber: 1,
          gradeLevelId: gradeLevels[9].id,
          classTeacherId: teachers[3].id,
          roomNumber: '301',
          floor: 3,
          capacity: 25,
          facilities: ['سبورة', 'مقاعد', 'مكيف', 'جهاز عرض', 'معمل كيمياء'],
          academicYearId: academicYears[1].id,
          semesterId: semesters[3].id,
          isActive: true
        }
      })
    ]);

    console.log('✅ Class rooms and grade subjects created successfully!');

    // Assign students to classes
    console.log('👨‍🎓 Assigning students to classes...');
    await Promise.all([
      // Assign first 5 students to Grade 1 - Section 1
      ...students.slice(0, 5).map(student =>
        prisma.student.update({
          where: { id: student.id },
          data: { classRoomId: classRooms[0].id }
        })
      ),
      // Assign next 5 students to Grade 1 - Section 2
      ...students.slice(5, 10).map(student =>
        prisma.student.update({
          where: { id: student.id },
          data: { classRoomId: classRooms[1].id }
        })
      ),
      // Assign demo student to Grade 2 - Section 1
      prisma.student.update({
        where: { id: students[10].id },
        data: { classRoomId: classRooms[2].id }
      })
    ]);

    // Create parent-student relationships
    console.log('👨‍👩‍👧‍👦 Creating parent-student relationships...');
    await Promise.all([
      prisma.studentParent.create({
        data: {
          studentId: students[0].id,
          parentId: parents[0].id,
          relationship: 'Father'
        }
      }),
      prisma.studentParent.create({
        data: {
          studentId: students[1].id,
          parentId: parents[1].id,
          relationship: 'Mother'
        }
      }),
      prisma.studentParent.create({
        data: {
          studentId: students[2].id,
          parentId: parents[2].id,
          relationship: 'Father'
        }
      }),
      prisma.studentParent.create({
        data: {
          studentId: students[3].id,
          parentId: parents[3].id,
          relationship: 'Father'
        }
      }),
      prisma.studentParent.create({
        data: {
          studentId: students[4].id,
          parentId: parents[4].id,
          relationship: 'Mother'
        }
      }),
      // Demo relationships
      prisma.studentParent.create({
        data: {
          studentId: students[10].id,
          parentId: parents[5].id,
          relationship: 'Father'
        }
      })
    ]);

    // Create teacher-subject relationships
    console.log('📚 Creating teacher-subject relationships...');
    await Promise.all([
      // Arabic teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[0].id, subjectId: subjects[0].id } },
        update: {},
        create: {
          teacherId: teachers[0].id,
          subjectId: subjects[0].id,
          isPrimary: true
        }
      }),
      // Math teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[1].id, subjectId: subjects[1].id } },
        update: {},
        create: {
          teacherId: teachers[1].id,
          subjectId: subjects[1].id,
          isPrimary: true
        }
      }),
      // English teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[2].id, subjectId: subjects[3].id } },
        update: {},
        create: {
          teacherId: teachers[2].id,
          subjectId: subjects[3].id,
          isPrimary: true
        }
      }),
      // Science teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[3].id, subjectId: subjects[2].id } },
        update: {},
        create: {
          teacherId: teachers[3].id,
          subjectId: subjects[2].id,
          isPrimary: true
        }
      }),
      // History teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[4].id, subjectId: subjects[5].id } },
        update: {},
        create: {
          teacherId: teachers[4].id,
          subjectId: subjects[5].id,
          isPrimary: true
        }
      }),
      // Geography teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[5].id, subjectId: subjects[6].id } },
        update: {},
        create: {
          teacherId: teachers[5].id,
          subjectId: subjects[6].id,
          isPrimary: true
        }
      }),
      // PE teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[6].id, subjectId: subjects[11].id } },
        update: {},
        create: {
          teacherId: teachers[6].id,
          subjectId: subjects[11].id,
          isPrimary: true
        }
      }),
      // Art teacher
      prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId: teachers[7].id, subjectId: subjects[10].id } },
        update: {},
        create: {
          teacherId: teachers[7].id,
          subjectId: subjects[10].id,
          isPrimary: true
        }
      })
    ]);

    console.log('✅ Teacher-subject relationships created successfully!');

    // Create time slots for the school day
    console.log('⏰ Creating time slots...');
    const timeSlots = await Promise.all([
      prisma.timeSlot.create({
        data: {
          name: 'الحصة الأولى',
          nameAr: 'الحصة الأولى',
          startTime: '08:00',
          endTime: '08:45',
          slotOrder: 1,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الحصة الثانية',
          nameAr: 'الحصة الثانية',
          startTime: '08:50',
          endTime: '09:35',
          slotOrder: 2,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الحصة الثالثة',
          nameAr: 'الحصة الثالثة',
          startTime: '09:40',
          endTime: '10:25',
          slotOrder: 3,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الراحة الأولى',
          nameAr: 'الراحة الأولى',
          startTime: '10:25',
          endTime: '10:40',
          slotOrder: 4,
          slotType: 'BREAK',
          duration: 15,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الحصة الرابعة',
          nameAr: 'الحصة الرابعة',
          startTime: '10:40',
          endTime: '11:25',
          slotOrder: 5,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الحصة الخامسة',
          nameAr: 'الحصة الخامسة',
          startTime: '11:30',
          endTime: '12:15',
          slotOrder: 6,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الحصة السادسة',
          nameAr: 'الحصة السادسة',
          startTime: '12:20',
          endTime: '13:05',
          slotOrder: 7,
          slotType: 'LESSON',
          duration: 45,
          isActive: true
        }
      }),
      prisma.timeSlot.create({
        data: {
          name: 'الغداء',
          nameAr: 'الغداء',
          startTime: '13:05',
          endTime: '13:45',
          slotOrder: 8,
          slotType: 'LUNCH',
          duration: 40,
          isActive: true
        }
      })
    ]);

    console.log('✅ Time slots created successfully!');

    // Create special locations
    console.log('🏢 Creating special locations...');
    const specialLocations = await Promise.all([
      prisma.specialLocation.create({
        data: {
          name: 'مختبر العلوم',
          nameAr: 'مختبر العلوم',
          type: 'LABORATORY',
          floor: 2,
          capacity: 25,
          facilities: ['مجهر', 'أدوات كيمياء', 'أدوات فيزياء'],
          description: 'مختبر العلوم للمرحلة الابتدائية والإعدادية',
          isActive: true
        }
      }),
      prisma.specialLocation.create({
        data: {
          name: 'غرفة الحاسوب',
          nameAr: 'غرفة الحاسوب',
          type: 'COMPUTER_LAB',
          floor: 1,
          capacity: 20,
          facilities: ['حواسيب', 'طابعات', 'شبكة إنترنت'],
          description: 'غرفة الحاسوب لتدريس المهارات الحاسوبية',
          isActive: true
        }
      }),
      prisma.specialLocation.create({
        data: {
          name: 'الصالة الرياضية',
          nameAr: 'الصالة الرياضية',
          type: 'GYMNASIUM',
          floor: 0,
          capacity: 100,
          facilities: ['أرضية رياضية', 'كرات', 'معدات رياضية'],
          description: 'الصالة الرياضية للأنشطة البدنية',
          isActive: true
        }
      }),
      prisma.specialLocation.create({
        data: {
          name: 'المكتبة',
          nameAr: 'المكتبة',
          type: 'LIBRARY',
          floor: 1,
          capacity: 50,
          facilities: ['كتب', 'طاولات قراءة', 'حواسيب'],
          description: 'المكتبة المدرسية',
          isActive: true
        }
      })
    ]);

    console.log('✅ Special locations created successfully!');

    // Create timetable entries
    console.log('📅 Creating timetable...');
    const timetables = await Promise.all([
      // Monday schedule for Grade 1 - Section 1
      prisma.timetable.create({
        data: {
          classRoomId: classRooms[0].id,
          subjectId: subjects[0].id, // Arabic
          teacherId: teachers[0].id,
          semesterId: semesters[3].id,
          timeSlotId: timeSlots[0].id,
          dayOfWeek: 1, // Monday
          slotType: 'LESSON',
          notes: 'حصة اللغة العربية',
          isActive: true
        }
      }),
      prisma.timetable.create({
        data: {
          classRoomId: classRooms[0].id,
          subjectId: subjects[1].id, // Math
          teacherId: teachers[1].id,
          semesterId: semesters[3].id,
          timeSlotId: timeSlots[1].id,
          dayOfWeek: 1,
          slotType: 'LESSON',
          notes: 'حصة الرياضيات',
          isActive: true
        }
      }),
      prisma.timetable.create({
        data: {
          classRoomId: classRooms[0].id,
          subjectId: subjects[2].id, // Science
          teacherId: teachers[3].id,
          semesterId: semesters[3].id,
          timeSlotId: timeSlots[2].id,
          dayOfWeek: 1,
          slotType: 'LESSON',
          notes: 'حصة العلوم',
          isActive: true
        }
      }),
      // Science lab session
      prisma.timetable.create({
        data: {
          classRoomId: classRooms[0].id,
          subjectId: subjects[2].id, // Science
          teacherId: teachers[3].id,
          specialLocationId: specialLocations[0].id,
          semesterId: semesters[3].id,
          timeSlotId: timeSlots[4].id,
          dayOfWeek: 1,
          slotType: 'LESSON',
          notes: 'حصة العلوم في المختبر',
          isActive: true
        }
      })
    ]);

    console.log('✅ Timetable created successfully!');

    // Create attendance records for the past month
    console.log('📊 Creating attendance records...');
    const attendanceRecords = [];
    const startDate = new Date('2024-09-01');
    const endDate = new Date('2024-12-31');

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Create attendance for each student in each class
      for (const classRoom of classRooms) {
        // Skip classrooms without teachers
        if (!classRoom.classTeacherId) continue;
        
        const classStudents = students.filter(s => s.classRoomId === classRoom.id);
        
        for (const student of classStudents) {
          // Random attendance status (90% present, 8% late, 2% absent)
          const random = Math.random();
          let status = 'PRESENT';
          if (random > 0.9 && random <= 0.98) status = 'LATE';
          else if (random > 0.98) status = 'ABSENT';

          attendanceRecords.push({
            studentId: student.id,
            teacherId: classRoom.classTeacherId,
            classRoomId: classRoom.id,
            timetableId: timetables[0].id, // Using first timetable entry
            date: new Date(date),
            status: status as any,
            remarks: status === 'LATE' ? 'متأخر' : status === 'ABSENT' ? 'غائب' : null
          });
        }
      }
    }

    // Insert attendance records in batches
    const batchSize = 100;
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      await prisma.attendance.createMany({
        data: batch,
        skipDuplicates: true
      });
    }

    console.log('✅ Attendance records created successfully!');

    // Create grades for students
    console.log('📈 Creating grade records...');
    const gradeRecords = [];

    for (const student of students) {
      for (const subject of subjects.slice(0, 8)) { // First 8 subjects
        // Create midterm and final grades
        gradeRecords.push({
          studentId: student.id,
          subjectId: subject.id,
          marks: Math.floor(Math.random() * 30) + 70, // 70-100 marks
          totalMarks: 100,
          examType: 'Midterm',
          examDate: new Date('2024-11-15')
        });
        gradeRecords.push({
          studentId: student.id,
          subjectId: subject.id,
          marks: Math.floor(Math.random() * 30) + 70, // 70-100 marks
          totalMarks: 100,
          examType: 'Final',
          examDate: new Date('2024-12-20')
        });
      }
    }

    await prisma.grade.createMany({
      data: gradeRecords,
      skipDuplicates: true
    });

    console.log('✅ Grade records created successfully!');

    // Create assignments
    console.log('📝 Creating assignments...');
    const assignments = await Promise.all([
      prisma.assignment.create({
        data: {
          title: 'تمرين الرياضيات - الجمع والطرح',
          description: 'حل المسائل الرياضية في الكتاب صفحة 25-30',
          classRoomId: classRooms[0].id,
          subjectId: subjects[1].id,
          teacherId: teachers[1].id,
          dueDate: new Date('2024-12-15'),
          totalMarks: 20,
          instructions: 'يجب حل جميع المسائل وحل كل خطوة من خطوات الحل',
          isActive: true,
          semesterId: semesters[3].id
        }
      }),
      prisma.assignment.create({
        data: {
          title: 'قراءة قصة "الأرنب والسلحفاة"',
          description: 'قراءة القصة وتلخيصها بـ 5 جمل',
          classRoomId: classRooms[0].id,
          subjectId: subjects[0].id,
          teacherId: teachers[0].id,
          dueDate: new Date('2024-12-10'),
          totalMarks: 15,
          instructions: 'التلخيص يجب أن يكون باللغة العربية الفصحى',
          isActive: true,
          semesterId: semesters[3].id
        }
      })
    ]);

    console.log('✅ Assignments created successfully!');

    // Create assignment submissions
    console.log('📤 Creating assignment submissions...');
    const submissions = await Promise.all([
      prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignments[0].id,
          studentId: students[0].id,
          content: 'تم حل جميع المسائل الرياضية',
          submittedAt: new Date('2024-12-14'),
          marksObtained: 18,
          feedback: 'عمل ممتاز، الحل صحيح',
          gradedAt: new Date('2024-12-16'),
          gradedById: teachers[1].id
        }
      }),
      prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignments[1].id,
          studentId: students[0].id,
          content: 'الأرنب كان متكبراً والسلحفاة كانت مجتهدة. ربحت السلحفاة السباق لأنها لم تتوقف. العبرة أن الاجتهاد يفوز على الكبر.',
          submittedAt: new Date('2024-12-09'),
          marksObtained: 14,
          feedback: 'تلخيص جيد، لكن يمكن تحسين اللغة',
          gradedAt: new Date('2024-12-11'),
          gradedById: teachers[0].id
        }
      })
    ]);

    console.log('✅ Assignment submissions created successfully!');

    // Create exams
    console.log('📋 Creating exams...');
    const exams = await Promise.all([
      prisma.exam.create({
        data: {
          title: 'امتحان نصف السنة - الرياضيات',
          description: 'امتحان شامل للمواد الرياضية المقررة في النصف الأول',
          classRoomId: classRooms[0].id,
          subjectId: subjects[1].id,
          teacherId: teachers[1].id,
          examDate: new Date('2024-12-20'),
          duration: 90,
          totalMarks: 100,
          instructions: 'يجب حل جميع الأسئلة. الحل يجب أن يكون واضحاً ومنظماً.',
          isActive: true,
          semesterId: semesters[3].id
        }
      }),
      prisma.exam.create({
        data: {
          title: 'امتحان نصف السنة - اللغة العربية',
          description: 'امتحان شامل لمهارات اللغة العربية',
          classRoomId: classRooms[0].id,
          subjectId: subjects[0].id,
          teacherId: teachers[0].id,
          examDate: new Date('2024-12-18'),
          duration: 75,
          totalMarks: 100,
          instructions: 'الإجابة يجب أن تكون باللغة العربية الفصحى.',
          isActive: true,
          semesterId: semesters[3].id
        }
      })
    ]);

    console.log('✅ Exams created successfully!');

    // Create exam results
    console.log('📊 Creating exam results...');
    const examResults = [];

    for (const student of students.slice(0, 5)) { // First 5 students
      for (const exam of exams) {
        examResults.push({
          examId: exam.id,
          studentId: student.id,
          marksObtained: Math.floor(Math.random() * 30) + 70, // 70-100 marks
          grade: Math.floor(Math.random() * 30) + 70 >= 90 ? 'ممتاز' : 
                 Math.floor(Math.random() * 30) + 70 >= 80 ? 'جيد جداً' :
                 Math.floor(Math.random() * 30) + 70 >= 70 ? 'جيد' : 'مقبول',
          remarks: 'أداء جيد في الامتحان'
        });
      }
    }

    await prisma.examResult.createMany({
      data: examResults,
      skipDuplicates: true
    });

    console.log('✅ Exam results created successfully!');

    // Create announcements
    console.log('📢 Creating announcements...');
    const announcements = await Promise.all([
      prisma.announcement.create({
        data: {
          title: 'إعلان مهم - إجازة نهاية الأسبوع',
          content: 'سيتم إغلاق المدرسة يومي الجمعة والسبت بمناسبة عيد الميلاد المجيد. عودة الدراسة يوم الأحد.',
          targetRoles: ['ALL'],
          priority: 'HIGH',
          isActive: true,
          expiresAt: new Date('2024-12-25'),
          createdById: users[0].id
        }
      }),
      prisma.announcement.create({
        data: {
          title: 'تذكير - تسليم الكتب المدرسية',
          content: 'يجب على جميع الطلاب تسليم الكتب المدرسية المستعملة قبل نهاية الفصل الدراسي.',
          targetRoles: ['STUDENTS', 'PARENTS'],
          priority: 'NORMAL',
          isActive: true,
          expiresAt: new Date('2025-01-15'),
          createdById: users[0].id
        }
      }),
      prisma.announcement.create({
        data: {
          title: 'اجتماع أولياء الأمور',
          content: 'سيتم عقد اجتماع لأولياء أمور الصف الأول الابتدائي يوم السبت المقبل في قاعة المدرسة.',
          targetRoles: ['PARENTS'],
          priority: 'NORMAL',
          isActive: true,
          expiresAt: new Date('2024-12-15'),
          createdById: users[1].id
        }
      })
    ]);

    console.log('✅ Announcements created successfully!');

    // Create events
    console.log('🎉 Creating events...');
    const events = await Promise.all([
      prisma.event.create({
        data: {
          title: 'احتفال بالعيد الوطني',
          titleAr: 'احتفال بالعيد الوطني',
          description: 'احتفال بالعيد الوطني السوري مع فقرات فنية وترفيهية',
          descriptionAr: 'احتفال بالعيد الوطني السوري مع فقرات فنية وترفيهية',
          eventDate: new Date('2024-12-25'),
          eventTime: '10:00',
          location: 'قاعة المدرسة الكبرى',
          locationAr: 'قاعة المدرسة الكبرى',
          type: 'GENERAL',
          targetRoles: ['ALL'],
          createdById: users[0].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'مباراة كرة قدم',
          titleAr: 'مباراة كرة قدم',
          description: 'مباراة كرة قدم بين فريقي الصف الأول والثاني',
          descriptionAr: 'مباراة كرة قدم بين فريقي الصف الأول والثاني',
          eventDate: new Date('2024-12-20'),
          eventTime: '14:00',
          location: 'الملعب المدرسي',
          locationAr: 'الملعب المدرسي',
          type: 'SPORTS',
          targetRoles: ['ALL'],
          createdById: users[6].id
        }
      }),
      prisma.event.create({
        data: {
          title: 'معرض الفنون',
          titleAr: 'معرض الفنون',
          description: 'معرض لأعمال الطلاب الفنية والإبداعية',
          descriptionAr: 'معرض لأعمال الطلاب الفنية والإبداعية',
          eventDate: new Date('2024-12-22'),
          eventTime: '11:00',
          location: 'غرفة الفنون',
          locationAr: 'غرفة الفنون',
          type: 'CULTURAL',
          targetRoles: ['ALL'],
          createdById: users[7].id
        }
      })
    ]);

    console.log('✅ Events created successfully!');

    // Create student academic progression records
    console.log('📈 Creating student academic progression records...');
    const progressions = await Promise.all([
      // Students promoted from 2023-2024 to 2024-2025
      prisma.studentAcademicProgression.create({
        data: {
          studentId: students[0].id,
          fromAcademicYearId: academicYears[0].id,
          fromSemesterId: semesters[1].id,
          fromGradeLevelId: gradeLevels[0].id,
          fromClassRoomId: classRooms[0].id,
          toAcademicYearId: academicYears[1].id,
          toSemesterId: semesters[3].id,
          toGradeLevelId: gradeLevels[1].id,
          toClassRoomId: classRooms[2].id,
          progressionType: 'PROMOTED',
          reason: 'تم الترفيع للصف الثاني',
          effectiveDate: new Date('2024-09-01'),
          processedById: users[0].id,
          notes: 'أداء ممتاز في جميع المواد'
        }
      }),
      prisma.studentAcademicProgression.create({
        data: {
          studentId: students[1].id,
          fromAcademicYearId: academicYears[0].id,
          fromSemesterId: semesters[1].id,
          fromGradeLevelId: gradeLevels[0].id,
          fromClassRoomId: classRooms[0].id,
          toAcademicYearId: academicYears[1].id,
          toSemesterId: semesters[3].id,
          toGradeLevelId: gradeLevels[1].id,
          toClassRoomId: classRooms[2].id,
          progressionType: 'PROMOTED',
          reason: 'تم الترفيع للصف الثاني',
          effectiveDate: new Date('2024-09-01'),
          processedById: users[0].id,
          notes: 'تحسن ملحوظ في الرياضيات'
        }
      })
    ]);

    console.log('✅ Student academic progression records created successfully!');

    console.log('🎉 Syrian Arabic database seed completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${gradeLevels.length} grade levels created`);
    console.log(`   - ${subjects.length} subjects created`);
    console.log(`   - ${academicYears.length} academic years created`);
    console.log(`   - ${semesters.length} semesters created`);
    console.log(`   - ${users.length} users created`);
    console.log(`   - ${teachers.length} teachers created`);
    console.log(`   - ${students.length} students created`);
    console.log(`   - ${parents.length} parents created`);
    console.log(`   - ${classRooms.length} class rooms created`);
    console.log(`   - ${timeSlots.length} time slots created`);
    console.log(`   - ${specialLocations.length} special locations created`);
    console.log(`   - ${timetables.length} timetable entries created`);
    console.log(`   - ${attendanceRecords.length} attendance records created`);
    console.log(`   - ${gradeRecords.length} grade records created`);
    console.log(`   - ${assignments.length} assignments created`);
    console.log(`   - ${submissions.length} assignment submissions created`);
    console.log(`   - ${exams.length} exams created`);
    console.log(`   - ${examResults.length} exam results created`);
    console.log(`   - ${announcements.length} announcements created`);
    console.log(`   - ${events.length} events created`);
    console.log(`   - ${progressions.length} progression records created`);

    console.log('\n🔐 Demo Accounts:');
    console.log('Admin: admin@school.com / password123');
    console.log('Teacher: teacher@school.com / password123');
    console.log('Student: student@school.com / password123');
    console.log('Parent: parent@school.com / password123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });