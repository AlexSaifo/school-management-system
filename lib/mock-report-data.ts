'use client';

/**
 * Mock data and helper functions for the reports page
 */

export interface Student {
  id: string;
  name: string;
  grade: string;
  attendance: number;
  averageGrade: number;
}

export interface Subject {
  id: string;
  name: string;
  averageGrade: number;
  passingRate: number;
  teacherId: string;
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  performance: number;
  subjects: string[];
}

export interface Class {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
  averageAttendance: number;
  averageGrade: number;
}

export interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface GradeDistribution {
  gradeRange: string;
  count: number;
  percentage: number;
}

export function generateMockStudents(count: number = 20): Student[] {
  const gradeOptions = ['A', 'B', 'C', 'D', 'F'];
  const students: Student[] = [];
  
  const firstNames = ['John', 'Emma', 'Aiden', 'Sophia', 'Lucas', 'Olivia', 'Ethan', 'Ava', 'Liam', 'Mia', 
                     'Noah', 'Isabella', 'Mason', 'Zoe', 'James', 'Lily', 'Benjamin', 'Emily', 'Jacob', 'Madison'];
  
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Anderson', 'Thomas', 
                    'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Clark', 'Lewis', 'Lee', 'Walker'];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const grade = gradeOptions[Math.floor(Math.random() * gradeOptions.length)];
    const attendance = Math.round(70 + Math.random() * 30);
    const averageGrade = Math.round(50 + Math.random() * 50);
    
    students.push({
      id: `STU${(1000 + i).toString()}`,
      name: `${firstName} ${lastName}`,
      grade,
      attendance,
      averageGrade
    });
  }
  
  return students;
}

export function generateMockSubjects(): Subject[] {
  const subjects = [
    { id: 'SUB1', name: 'Mathematics', averageGrade: 72, passingRate: 78, teacherId: 'T1' },
    { id: 'SUB2', name: 'Science', averageGrade: 68, passingRate: 74, teacherId: 'T2' },
    { id: 'SUB3', name: 'English', averageGrade: 76, passingRate: 85, teacherId: 'T3' },
    { id: 'SUB4', name: 'History', averageGrade: 71, passingRate: 82, teacherId: 'T4' },
    { id: 'SUB5', name: 'Geography', averageGrade: 70, passingRate: 80, teacherId: 'T5' },
    { id: 'SUB6', name: 'Art', averageGrade: 86, passingRate: 95, teacherId: 'T6' },
    { id: 'SUB7', name: 'Physical Education', averageGrade: 88, passingRate: 96, teacherId: 'T7' },
    { id: 'SUB8', name: 'Computer Science', averageGrade: 74, passingRate: 79, teacherId: 'T8' },
  ];
  
  return subjects;
}

export function generateMockTeachers(): Teacher[] {
  const teachers = [
    { id: 'T1', name: 'Mrs. Johnson', department: 'Mathematics', performance: 92, subjects: ['Algebra', 'Calculus'] },
    { id: 'T2', name: 'Mr. Thompson', department: 'Science', performance: 87, subjects: ['Biology', 'Chemistry'] },
    { id: 'T3', name: 'Ms. Davis', department: 'English', performance: 94, subjects: ['Literature', 'Grammar'] },
    { id: 'T4', name: 'Mr. Wilson', department: 'History', performance: 89, subjects: ['World History', 'Civics'] },
    { id: 'T5', name: 'Mrs. Martinez', department: 'Geography', performance: 90, subjects: ['World Geography'] },
    { id: 'T6', name: 'Ms. Anderson', department: 'Arts', performance: 95, subjects: ['Fine Arts', 'Music'] },
    { id: 'T7', name: 'Mr. Thomas', department: 'Physical Education', performance: 93, subjects: ['Sports', 'Health'] },
    { id: 'T8', name: 'Dr. Clark', department: 'Computer Science', performance: 91, subjects: ['Programming', 'Web Design'] },
  ];
  
  return teachers;
}

export function generateMockClasses(): Class[] {
  const classes = [
    { id: 'C1', name: '9A', gradeLevel: '9th Grade', studentCount: 28, averageAttendance: 92, averageGrade: 76 },
    { id: 'C2', name: '9B', gradeLevel: '9th Grade', studentCount: 26, averageAttendance: 94, averageGrade: 78 },
    { id: 'C3', name: '10A', gradeLevel: '10th Grade', studentCount: 25, averageAttendance: 90, averageGrade: 74 },
    { id: 'C4', name: '10B', gradeLevel: '10th Grade', studentCount: 27, averageAttendance: 91, averageGrade: 75 },
    { id: 'C5', name: '11A', gradeLevel: '11th Grade', studentCount: 24, averageAttendance: 88, averageGrade: 72 },
    { id: 'C6', name: '11B', gradeLevel: '11th Grade', studentCount: 23, averageAttendance: 89, averageGrade: 73 },
    { id: 'C7', name: '12A', gradeLevel: '12th Grade', studentCount: 22, averageAttendance: 86, averageGrade: 77 },
    { id: 'C8', name: '12B', gradeLevel: '12th Grade', studentCount: 21, averageAttendance: 87, averageGrade: 79 },
  ];
  
  return classes;
}

export function generateAttendanceData(days: number = 30): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const totalStudents = 320;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    const present = Math.floor(totalStudents * (0.85 + Math.random() * 0.1));
    const absent = Math.floor((totalStudents - present) * 0.7);
    const late = Math.floor((totalStudents - present) * 0.2);
    const excused = totalStudents - present - absent - late;
    
    records.push({
      date: date.toISOString().split('T')[0],
      present,
      absent,
      late,
      excused,
      total: totalStudents
    });
  }
  
  return records;
}

export function generateGradeDistribution(): GradeDistribution[] {
  return [
    { gradeRange: 'A (90-100)', count: 42, percentage: 13.1 },
    { gradeRange: 'B (80-89)', count: 87, percentage: 27.2 },
    { gradeRange: 'C (70-79)', count: 103, percentage: 32.2 },
    { gradeRange: 'D (60-69)', count: 56, percentage: 17.5 },
    { gradeRange: 'F (<60)', count: 32, percentage: 10.0 },
  ];
}

export function generateMonthlyAttendance(): any[] {
  return [
    { month: 'Jan', attendance: 94.2 },
    { month: 'Feb', attendance: 93.8 },
    { month: 'Mar', attendance: 91.5 },
    { month: 'Apr', attendance: 92.7 },
    { month: 'May', attendance: 90.3 },
    { month: 'Jun', attendance: 88.9 },
    { month: 'Jul', attendance: 0 }, // Summer break
    { month: 'Aug', attendance: 95.2 }, // Back to school
    { month: 'Sep', attendance: 93.1 },
  ];
}

export function generateSubjectPerformance(): any[] {
  return [
    { subject: 'Math', average: 72 },
    { subject: 'Science', average: 68 },
    { subject: 'English', average: 76 },
    { subject: 'History', average: 71 },
    { subject: 'Geography', average: 70 },
    { subject: 'Art', average: 86 },
    { subject: 'PE', average: 88 },
    { subject: 'CS', average: 74 },
  ];
}