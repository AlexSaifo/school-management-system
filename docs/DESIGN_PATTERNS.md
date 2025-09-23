# Design Patterns Implementation

## Overview

The School Management System implements various design patterns to ensure maintainable, scalable, and robust code. This document outlines the key design patterns used throughout the application and how they contribute to the system's architecture.

## Architectural Patterns

### 1. **Layered Architecture Pattern**

#### Implementation
```
Presentation Layer (Frontend)
├── Components (React Components)
├── Contexts (State Management)
├── Hooks (Custom Logic)
└── Utils (Helper Functions)

Application Layer (API)
├── Routes (API Endpoints)
├── Middleware (Authentication, Validation)
├── Services (Business Logic)
└── Controllers (Request Handling)

Domain Layer (Business Rules)
├── Models (Prisma Schemas)
├── Validators (Zod Schemas)
├── Types (TypeScript Interfaces)
└── Constants (Application Constants)

Infrastructure Layer (External Concerns)
├── Database (Prisma Client)
├── File System (Upload Handling)
├── External APIs (Third-party Integrations)
└── Logging (Error Tracking)
```

#### Benefits
- **Separation of Concerns**: Each layer has distinct responsibilities
- **Testability**: Layers can be tested independently
- **Maintainability**: Changes in one layer don't affect others
- **Scalability**: Layers can be scaled independently

### 2. **Repository Pattern**

#### Implementation
```typescript
// Repository Interface
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}

// Prisma-based Implementation
class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { admin: true, teacher: true, student: true, parent: true }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: { admin: true, teacher: true, student: true, parent: true }
    });
  }

  // ... other methods
}
```

#### Usage in API Routes
```typescript
// API Route using Repository
export async function GET(request: NextRequest) {
  const userRepository = new PrismaUserRepository();
  const users = await userRepository.findAll();
  return NextResponse.json({ data: users });
}
```

#### Benefits
- **Data Access Abstraction**: Business logic doesn't depend on data storage
- **Testability**: Repositories can be mocked for unit testing
- **Flexibility**: Easy to switch data sources (PostgreSQL → MongoDB)
- **Consistency**: Standardized data access patterns

## Frontend Patterns

### 3. **Context Pattern (State Management)**

#### Authentication Context
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: React.ReactNode) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication logic
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { token, user } = await response.json();
        setToken(token);
        setUser(user);
        localStorage.setItem('auth_token', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const response = await fetch('/api/auth/profile', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const value = { user, token, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Language Context
```typescript
// LanguageContext.tsx
interface LanguageContextType {
  language: 'en' | 'ar';
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
    setDirection(lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('language', lang);
    // Update i18next
    i18n.changeLanguage(lang);
  };

  // Initialize from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as 'en' | 'ar' || 'en';
    setLanguage(savedLang);
  }, []);

  const t = (key: string) => i18n.t(key);

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

#### Benefits
- **Global State Management**: Centralized state accessible throughout the app
- **Performance**: Avoids prop drilling
- **Reusability**: Contexts can be used across different components
- **Type Safety**: TypeScript interfaces ensure correct usage

### 4. **Custom Hook Pattern**

#### API Hook
```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  url: string,
  options: RequestInit = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
}
```

#### Form Hook
```typescript
// hooks/useForm.ts
import { useState, useCallback } from 'react';

interface UseFormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

interface UseFormActions<T> {
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T) => void;
  reset: () => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => Promise<void>;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: any
): UseFormState<T> & UseFormActions<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const validate = useCallback(() => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      const formattedErrors: Partial<Record<keyof T, string>> = {};
      error.errors.forEach((err: any) => {
        formattedErrors[err.path[0] as keyof T] = err.message;
      });
      setErrors(formattedErrors);
      return false;
    }
  }, [values, validationSchema]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void>) =>
      async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (validate()) {
          try {
            await onSubmit(values);
          } catch (error) {
            console.error('Form submission error:', error);
          }
        }

        setIsSubmitting(false);
      },
    [values, validate]
  );

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouched,
    reset,
    handleSubmit,
  };
}
```

#### Benefits
- **Reusability**: Logic can be shared across components
- **Testability**: Hooks can be tested independently
- **Composition**: Multiple hooks can be combined
- **Performance**: Avoids unnecessary re-renders

### 5. **Component Composition Pattern**

#### Layout Components
```tsx
// components/layout/SidebarLayout.tsx
interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export default function SidebarLayout({
  children,
  sidebar,
  header
}: SidebarLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {sidebar && (
        <Box component="nav" sx={{ width: 240, flexShrink: 0 }}>
          {sidebar}
        </Box>
      )}

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {header && (
          <Box component="header" sx={{ height: 64 }}>
            {header}
          </Box>
        )}

        <Box sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
```

#### Data Table Component
```tsx
// components/DataTable.tsx
interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface Action<T> {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (row: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    limit: number;
    onChange: (page: number) => void;
  };
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  actions,
  loading = false,
  pagination
}: DataTableProps<T>) {
  // Implementation
}
```

#### Benefits
- **Reusability**: Components can be used across different pages
- **Consistency**: Standardized UI patterns
- **Maintainability**: Changes in one place affect all usages
- **Flexibility**: Props allow customization

## Backend Patterns

### 6. **Middleware Pattern**

#### Authentication Middleware
```typescript
// lib/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function withAuth(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>,
  options: { requireRole?: string[] } = {}
) {
  return async (request: NextRequest) => {
    try {
      // Extract token from header or cookie
      let token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        token = request.cookies.get('auth_token')?.value;
      }

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify token
      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check role requirements
      if (options.requireRole && !options.requireRole.includes(decoded.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Call handler with user context
      return await handler(request, { user: decoded });
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

#### Validation Middleware
```typescript
// lib/validation-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Parse request body
      const body = await request.json();

      // Validate with Zod schema
      const validatedData = schema.parse(body);

      // Call handler with validated data
      return await handler(request, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }

      console.error('Validation middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

#### Benefits
- **Separation of Concerns**: Cross-cutting concerns handled separately
- **Reusability**: Middleware can be applied to multiple routes
- **Consistency**: Standardized error handling and validation
- **Maintainability**: Changes affect all routes using the middleware

### 7. **Service Layer Pattern**

#### Business Service
```typescript
// services/UserService.ts
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export class UserService {
  async createUser(userData: CreateUserData) {
    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user with role-specific data
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      include: {
        admin: true,
        teacher: true,
        student: true,
        parent: true,
      }
    });

    return user;
  }

  async authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
        teacher: true,
        student: true,
        parent: true,
      }
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { user, token };
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        admin: true,
        teacher: true,
        student: {
          include: {
            classRoom: {
              include: {
                gradeLevel: true
              }
            }
          }
        },
        parent: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
```

#### Benefits
- **Business Logic Centralization**: All business rules in one place
- **Testability**: Services can be unit tested independently
- **Reusability**: Services can be used across multiple API routes
- **Maintainability**: Business logic changes are isolated

### 8. **Factory Pattern**

#### Model Factory
```typescript
// factories/UserFactory.ts
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export class UserFactory {
  static async createAdmin(data: CreateAdminData) {
    const hashedPassword = await hashPassword(data.password);

    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'ADMIN',
        admin: {
          create: {
            permissions: data.permissions || {}
          }
        }
      },
      include: { admin: true }
    });
  }

  static async createTeacher(data: CreateTeacherData) {
    const hashedPassword = await hashPassword(data.password);

    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'TEACHER',
        teacher: {
          create: {
            employeeId: data.employeeId,
            department: data.department,
            qualification: data.qualification,
            experience: data.experience,
            salary: data.salary,
            joinDate: data.joinDate
          }
        }
      },
      include: { teacher: true }
    });
  }

  static async createStudent(data: CreateStudentData) {
    const hashedPassword = await hashPassword(data.password);

    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
        student: {
          create: {
            studentId: data.studentId,
            dateOfBirth: data.dateOfBirth,
            bloodGroup: data.bloodGroup,
            emergencyContact: data.emergencyContact,
            admissionDate: data.admissionDate,
            classRoomId: data.classRoomId
          }
        }
      },
      include: {
        student: {
          include: {
            classRoom: true
          }
        }
      }
    });
  }
}
```

#### Benefits
- **Object Creation Logic**: Centralized complex object creation
- **Consistency**: Ensures all objects are created with correct relationships
- **Maintainability**: Changes to creation logic in one place
- **Type Safety**: Factory methods can enforce correct data types

### 9. **Observer Pattern (Real-time Updates)**

#### Socket.IO Implementation
```typescript
// lib/socket.ts
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const initSocket = (httpServer: NetServer) => {
  const io = new ServerIO(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join-user', (userId: string) => {
      socket.join(`user_${userId}`);
    });

    // Join class room
    socket.on('join-class', (classId: string) => {
      socket.join(`class_${classId}`);
    });

    // Handle attendance updates
    socket.on('attendance-updated', (data) => {
      // Broadcast to class room
      socket.to(`class_${data.classId}`).emit('attendance-changed', data);
    });

    // Handle announcements
    socket.on('announcement-created', (data) => {
      // Broadcast to relevant users based on target roles
      io.emit('new-announcement', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
```

#### React Socket Hook
```typescript
// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Join user room if userId provided
    if (userId) {
      socket.emit('join-user', userId);
    }

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  };

  return { socket: socketRef.current, emit, on, off };
}
```

#### Benefits
- **Real-time Communication**: Instant updates across clients
- **Decoupling**: Publishers and subscribers don't need to know each other
- **Scalability**: Can handle multiple observers
- **Flexibility**: Easy to add new event types

### 10. **Strategy Pattern (Validation)**

#### Validation Strategies
```typescript
// strategies/validation/ValidationStrategy.ts
export interface ValidationStrategy {
  validate(data: any): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// strategies/validation/UserValidationStrategy.ts
export class UserValidationStrategy implements ValidationStrategy {
  validate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Invalid email address');
    }

    if (!data.firstName || data.firstName.length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!data.lastName || data.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters');
    }

    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// strategies/validation/StudentValidationStrategy.ts
export class StudentValidationStrategy implements ValidationStrategy {
  validate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.studentId) {
      errors.push('Student ID is required');
    }

    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    }

    const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
    if (age < 5 || age > 25) {
      errors.push('Student age must be between 5 and 25 years');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

#### Validation Context
```typescript
// contexts/ValidationContext.ts
import { ValidationStrategy, ValidationResult } from './strategies/ValidationStrategy';

export class ValidationContext {
  private strategy: ValidationStrategy;

  constructor(strategy: ValidationStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ValidationStrategy) {
    this.strategy = strategy;
  }

  validate(data: any): ValidationResult {
    return this.strategy.validate(data);
  }
}

// Usage
const userValidator = new ValidationContext(new UserValidationStrategy());
const studentValidator = new ValidationContext(new StudentValidationStrategy());

const userResult = userValidator.validate(userData);
const studentResult = studentValidator.validate(studentData);
```

#### Benefits
- **Flexibility**: Different validation rules for different contexts
- **Extensibility**: Easy to add new validation strategies
- **Testability**: Each strategy can be tested independently
- **Maintainability**: Validation logic is organized and reusable

## Conclusion

The School Management System demonstrates a comprehensive implementation of modern design patterns that contribute to its maintainability, scalability, and robustness. The strategic use of these patterns ensures clean architecture, separation of concerns, and adherence to SOLID principles throughout the codebase.

Key patterns implemented include:
- **Layered Architecture** for separation of concerns
- **Repository Pattern** for data access abstraction
- **Context Pattern** for state management
- **Custom Hooks** for reusable logic
- **Component Composition** for UI flexibility
- **Middleware Pattern** for cross-cutting concerns
- **Service Layer** for business logic encapsulation
- **Factory Pattern** for complex object creation
- **Observer Pattern** for real-time communication
- **Strategy Pattern** for flexible validation

These patterns work together to create a cohesive, well-structured application that can evolve with changing requirements while maintaining code quality and developer productivity.