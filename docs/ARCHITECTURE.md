# Architecture Documentation

## System Architecture

The School Management System follows a modern, scalable architecture designed for maintainability, performance, and extensibility. This document outlines the architectural decisions, patterns, and implementation details.

## Architectural Overview

### 🏛️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React Components│   │ • API Routes    │   │ • Prisma Schema │
│ • Context State  │   │ • Business Logic │   │ • Migrations    │
│ • UI/UX Layer   │   │ • Authentication │   │ • Seed Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │   External      │
                    │   Services      │
                    │                 │
                    │ • Docker        │
                    │ • Socket.IO     │
                    │ • File Storage  │
                    └─────────────────┘
```

## Architecture Patterns

### 1. **Layered Architecture**

The system is organized into distinct layers, each with specific responsibilities:

#### Presentation Layer (Frontend)
- **Framework**: Next.js 14 with App Router
- **UI Library**: Material-UI (MUI) with custom theming
- **State Management**: React Context API
- **Routing**: Next.js file-based routing
- **Styling**: Material-UI + Tailwind CSS hybrid approach

#### Application Layer (API)
- **Framework**: Next.js API Routes
- **Authentication**: JWT-based with middleware
- **Validation**: Zod schemas for input validation
- **Error Handling**: Centralized error management
- **CORS**: Configured for cross-origin requests

#### Domain Layer (Business Logic)
- **ORM**: Prisma Client for database operations
- **Models**: Type-safe database models
- **Services**: Business logic encapsulation
- **Validation**: Domain-specific validation rules

#### Infrastructure Layer
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Local file system with organized structure
- **Caching**: In-memory caching for static data
- **External APIs**: Integration points for third-party services

### 2. **Component Architecture**

#### Atomic Design Pattern
```
Atoms (Basic UI Elements)
├── Buttons, Inputs, Icons, Typography

Molecules (Composite UI Elements)
├── Form Fields, Cards, Navigation Items

Organisms (Complex UI Sections)
├── Navigation Bars, Data Tables, Forms

Templates (Page Layouts)
├── Dashboard Layouts, Form Templates

Pages (Complete Views)
├── User Dashboard, Admin Panel, Student Profile
```

#### Component Organization
```
components/
├── ui/           # Reusable UI components
├── forms/        # Form-specific components
├── layout/       # Layout components
├── dashboard/    # Dashboard widgets
├── academic/     # Academic management components
└── shared/       # Shared components
```

### 3. **State Management Architecture**

#### Context-Based State Management
```typescript
// AuthContext - Global authentication state
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// LanguageContext - Internationalization state
interface LanguageContextType {
  language: 'en' | 'ar';
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: string) => void;
}

// SocketContext - Real-time communication
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data: any) => void;
}
```

#### State Flow
```
User Action → Component → Context → API Call → Database
                                      ↓
UI Update ← Context ← Response ← API Route ← Database
```

### 4. **API Architecture**

#### RESTful API Design
- **Resource-Based URLs**: `/api/users`, `/api/classes`, `/api/attendance`
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **Status Codes**: Standard HTTP status codes
- **Response Format**: Consistent JSON structure

#### API Route Structure
```
app/api/
├── auth/         # Authentication endpoints
│   ├── login/    # POST /api/auth/login
│   ├── register/ # POST /api/auth/register
│   └── profile/  # GET /api/auth/profile
├── users/        # User management
│   ├── route.ts  # GET, POST /api/users
│   └── [id]/     # PUT, DELETE /api/users/[id]
├── academic/     # Academic management
└── ...
```

#### Request/Response Patterns
```typescript
// Request Pattern
interface ApiRequest<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

// Response Pattern
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### 5. **Database Architecture**

#### Schema Design Principles
- **Normalization**: Proper normalization to reduce redundancy
- **Relationships**: Foreign keys with referential integrity
- **Indexing**: Strategic indexing for performance
- **Constraints**: Database-level constraints for data integrity

#### Prisma ORM Architecture
```prisma
// Schema Definition
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // ... fields

  // Relations
  admin     Admin?
  teacher   Teacher?
  student   Student?
  parent    Parent?
}

// Generated Client
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    admin: true,
    teacher: true,
    student: true,
  }
});
```

## Security Architecture

### Authentication & Authorization

#### JWT-Based Authentication
```typescript
// Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Middleware Implementation
export function authMiddleware(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (req as any).user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

#### Role-Based Access Control (RBAC)
```typescript
enum Permission {
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  CLASS_MANAGE = 'class:manage',
  ATTENDANCE_MARK = 'attendance:mark',
}

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [Permission.USER_READ, Permission.USER_WRITE, Permission.CLASS_MANAGE],
  TEACHER: [Permission.ATTENDANCE_MARK],
  STUDENT: [Permission.USER_READ],
  PARENT: [Permission.USER_READ],
};
```

### Data Protection

#### Password Security
- **Hashing**: bcryptjs with salt rounds
- **Storage**: Secure password storage
- **Validation**: Strong password requirements

#### Input Validation
```typescript
// Zod Schema Validation
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

## Performance Architecture

### Frontend Optimization

#### Code Splitting
```typescript
// Dynamic Imports
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <DashboardSkeleton />,
});

// Route-based Splitting
const TeacherPage = dynamic(() => import('@/app/teacher/page'));
```

#### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/student-avatar.jpg"
  alt="Student Avatar"
  width={100}
  height={100}
  priority
  placeholder="blur"
/>
```

### Database Optimization

#### Query Optimization
```typescript
// Efficient Queries with Select
const users = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
  where: { role: 'STUDENT' },
  take: 50,
  skip: 0,
});

// Indexed Queries
const students = await prisma.student.findMany({
  where: {
    classRoomId: classId,
    user: { status: 'ACTIVE' }
  },
  include: {
    user: true,
  }
});
```

#### Connection Pooling
```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=10&pool_timeout=0"
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: No server-side session storage
- **Database Sharding**: Potential for future sharding
- **CDN Integration**: Static asset delivery
- **Load Balancing**: Ready for load balancer integration

### Caching Strategy
```typescript
// API Response Caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetchData();
  cache.set(key, data, CACHE_DURATION);
  return data;
}
```

## Deployment Architecture

### Docker Containerization
```dockerfile
# Multi-stage Build
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
```

### Environment Configuration
```env
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
JWT_SECRET=your-production-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
```

## Monitoring & Logging

### Application Monitoring
```typescript
// Error Tracking
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Performance Monitoring
export async function logApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) {
  // Log to monitoring service
}
```

### Database Monitoring
- **Query Performance**: Slow query logging
- **Connection Pool**: Pool utilization monitoring
- **Index Usage**: Index effectiveness tracking
- **Backup Status**: Automated backup verification

## Conclusion

The School Management System architecture provides a solid foundation for a scalable, maintainable, and secure educational platform. The layered approach, combined with modern React patterns and robust backend design, ensures the system can evolve with changing requirements while maintaining high performance and security standards.