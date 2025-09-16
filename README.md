# School Management System

A comprehensive multi-role authentication system built with Next.js, TypeScript, PostgreSQL, Prisma, Docker, and Material-UI.

## Features

- **Multi-Role Authentication**: Support for Admin, Teacher, Student, and Parent roles
- **Encrypted Password Storage**: Secure password hashing with bcryptjs
- **Role-Based Access Control**: Different permissions and dashboard views for each role
- **Modern UI**: Beautiful interface built with Material-UI components
- **Database Management**: PostgreSQL with Prisma ORM
- **Docker Integration**: Easy database setup with Docker Compose
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Material-UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Docker)
- **Authentication**: JWT, bcryptjs
- **Styling**: Material-UI, Tailwind CSS
- **Development**: TypeScript, ESLint

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed

### 1. Clone and Setup

```bash
cd "D:\MyFiles\Job\freelance\School Management System\school-management-app"
npm install
```

### 2. Start Database

```bash
npm run docker:up
```

This will start:
- PostgreSQL database on port 5432
- pgAdmin on port 5050 (admin@school.com / admin123)

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Demo Credentials

The system comes with pre-seeded demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@school.com | password123 |
| **Teacher** | teacher@school.com | password123 |
| **Student** | student@school.com | password123 |
| **Parent** | parent@school.com | password123 |

## Role Permissions

### Admin
- ✅ Full system access
- ✅ User management
- ✅ Class management
- ✅ System reports
- ✅ All data access

### Teacher
- ✅ Class management
- ✅ Student attendance
- ✅ Grade assignments
- ✅ View assigned students
- ❌ System administration

### Student
- ✅ View own grades
- ✅ View own attendance
- ✅ View assignments
- ✅ View class information
- ❌ Administrative functions

### Parent
- ✅ View child's grades
- ✅ View child's attendance
- ✅ Communicate with teachers
- ✅ View school announcements
- ❌ Administrative functions

## Database Schema

### Core Entities

- **Users**: Base user information with roles
- **Admin**: Admin-specific data and permissions
- **Teacher**: Teacher profiles and employment details
- **Student**: Student profiles and academic information
- **Parent**: Parent profiles and relationship data
- **Class**: Class/grade management
- **Subject**: Subject management
- **Attendance**: Daily attendance tracking
- **Grade**: Student performance tracking

### Relationships

- Students ↔ Parents (Many-to-Many)
- Students ↔ Classes (Many-to-One)
- Teachers ↔ Classes (One-to-Many)
- Students ↔ Grades (One-to-Many)
- Classes ↔ Subjects (One-to-Many)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Users (Protected)
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (Admin only)

## Environment Variables

Create `.env.local` file (already provided):

```env
DATABASE_URL="postgresql://school_admin:school_password_123@localhost:5432/school_management"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
JWT_SECRET="your-jwt-secret-key-here-change-in-production"
NODE_ENV="development"
```

## Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run docker:up          # Start PostgreSQL with Docker
npm run docker:down        # Stop Docker containers
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:migrate         # Run database migrations
npm run db:seed            # Seed database with demo data
npm run db:studio          # Open Prisma Studio

# Code Quality
npm run lint              # Run ESLint
```

## Project Structure

```
school-management-app/
├── app/                          # Next.js 14 app directory
│   ├── api/                      # API routes
│   │   └── auth/                 # Authentication endpoints
│   ├── dashboard/                # Protected dashboard pages
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (login)
├── components/                   # React components
│   ├── auth/                    # Authentication components
│   ├── dashboard/               # Dashboard components
│   └── layout/                  # Layout components
├── contexts/                    # React contexts
│   └── AuthContext.tsx          # Authentication context
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication utilities
│   ├── prisma.ts               # Prisma client
│   └── validations.ts          # Zod schemas
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding
├── docker-compose.yml          # Docker configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Granular permissions per role
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **Environment Variables**: Sensitive data in environment files

## Production Deployment

1. **Database**: Set up PostgreSQL database
2. **Environment**: Update `.env` with production values
3. **Build**: `npm run build`
4. **Deploy**: Deploy to your preferred platform (Vercel, Railway, etc.)

## Troubleshooting

### Database Connection Issues
```bash
# Restart Docker containers
npm run docker:down && npm run docker:up

# Check if containers are running
docker ps
```

### Prisma Issues
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npm run db:generate
```

### Port Conflicts
- PostgreSQL: Change port in `docker-compose.yml`
- Next.js: Use `npm run dev -- -p 3001`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes. Feel free to use as a starting point for your own school management system.

## Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Happy Learning! 🎓**
