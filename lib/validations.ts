import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
});

export const teacherSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  subject: z.string().min(1, 'Subject is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  experience: z.number().min(0, 'Experience must be a positive number'),
  salary: z.number().optional(),
  joinDate: z.date(),
});

export const studentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().optional(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.date(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  admissionDate: z.date(),
});

export const parentSchema = z.object({
  occupation: z.string().optional(),
  relationship: z.string().min(1, 'Relationship is required'),
});

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  section: z.string().min(1, 'Section is required'),
  grade: z.string().min(1, 'Grade is required'),
  teacherId: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  academicYear: z.string().min(1, 'Academic year is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type TeacherInput = z.infer<typeof teacherSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type ParentInput = z.infer<typeof parentSchema>;
export type ClassInput = z.infer<typeof classSchema>;
