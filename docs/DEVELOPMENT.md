# Development Setup Guide

## Prerequisites

Before setting up the School Management System, ensure you have the following software installed on your system:

### Required Software

1. **Node.js** (version 18.17.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Required for running PostgreSQL database
   - Verify installation: `docker --version`

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **Visual Studio Code** (recommended)
   - Download from: https://code.visualstudio.com/
   - Install recommended extensions for React/TypeScript development

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: At least 5GB free space
- **Internet Connection**: Required for package installation and Docker image downloads

## Step-by-Step Setup

### Step 1: Clone the Repository

1. Open your terminal/command prompt
2. Navigate to your desired workspace directory:
   ```bash
   cd /path/to/your/workspace
   ```
3. Clone the repository:
   ```bash
   git clone <repository-url> school-management-app
   cd school-management-app
   ```

### Step 2: Install Node.js Dependencies

1. Install all required dependencies:
   ```bash
   npm install
   ```

   This will install all packages listed in `package.json`, including:
   - Next.js 14 (React framework)
   - Prisma (database ORM)
   - Material-UI (UI components)
   - Socket.IO (real-time communication)
   - And many other dependencies

2. Verify installation:
   ```bash
   npm list --depth=0
   ```

### Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```

2. Copy the following environment variables into `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://school_admin:school_password@localhost:5432/school_management?schema=public"

   # JWT Secret (generate a secure random string)
   JWT_SECRET="your-super-secure-jwt-secret-key-here-change-this-in-production"

   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-here"

   # Email Configuration (optional - for notifications)
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@school.com"

   # File Upload Configuration
   UPLOAD_DIR="./public/uploads"
   MAX_FILE_SIZE="10485760"  # 10MB in bytes

   # Socket.IO Configuration
   SOCKET_PORT="3001"

   # Development Settings
   NODE_ENV="development"
   DEBUG="true"
   ```

3. **Important Security Notes:**
   - Never commit `.env.local` to version control
   - Generate a strong JWT secret (at least 32 characters)
   - Use different secrets for development and production
   - For production, use environment-specific secrets

### Step 4: Set Up Docker and PostgreSQL

1. **Start Docker Desktop:**
   - Open Docker Desktop application
   - Wait for Docker to start (whale icon in system tray should be running)

2. **Start PostgreSQL Database:**
   ```bash
   # Navigate to the project directory
   cd school-management-app

   # Start PostgreSQL using Docker Compose
   docker-compose up -d
   ```

   This command will:
   - Download the PostgreSQL Docker image (if not already downloaded)
   - Create a container named `school-postgres`
   - Set up the database with the credentials from your `.env.local`
   - Map port 5432 on your host to the container

3. **Verify Database Connection:**
   ```bash
   # Check if container is running
   docker ps

   # You should see a container named 'school-postgres' running
   ```

4. **Alternative: Using Docker Run (if docker-compose fails):**
   ```bash
   docker run --name school-postgres \
     -e POSTGRES_USER=school_admin \
     -e POSTGRES_PASSWORD=school_password \
     -e POSTGRES_DB=school_management \
     -p 5432:5432 \
     -d postgres:15
   ```

### Step 5: Set Up Database Schema

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations:**
   ```bash
   npx prisma db push
   ```

   This will create all the database tables based on your `prisma/schema.prisma` file.

3. **Optional: View Database in Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   This opens a web interface at `http://localhost:5555` to view and edit your database.

### Step 6: Seed the Database (Optional)

If you want to populate the database with sample data:

1. **Run the seeding script:**
   ```bash
   npm run seed
   ```

   Or run directly:
   ```bash
   npx ts-node prisma/seed-comprehensive.ts
   ```

   This will create sample users, classes, subjects, and other data for testing.

### Step 7: Start the Development Server

1. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

3. **You should see the School Management System login page.**

### Step 8: Verify Installation

1. **Test Database Connection:**
   - Try logging in with admin credentials (if seeded)
   - Default admin email: `admin@school.com`
   - Default password: `admin123`

2. **Test Real-time Features:**
   - Open multiple browser tabs
   - Test chat functionality
   - Check real-time notifications

3. **Test File Upload:**
   - Try uploading a profile picture or assignment file
   - Verify files are saved in `public/uploads/`

## Development Workflow

### Running the Application

```bash
# Start development server
npm run dev

# Start with custom port
npm run dev -- -p 3001

# Build for production
npm run build

# Start production server
npm start
```

### Database Operations

```bash
# View database in browser
npx prisma studio

# Create and run migrations
npx prisma migrate dev --name your-migration-name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Update database schema
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format

# Run tests (if implemented)
npm test
```

## Troubleshooting

### Common Issues

#### 1. **Port 5432 Already in Use**
```
Error: Port 5432 is already in use
```
**Solution:**
- Stop other PostgreSQL instances
- Or change the port in docker-compose.yml and .env.local

#### 2. **Database Connection Failed**
```
Error: P1001: Can't reach database server
```
**Solutions:**
- Ensure Docker Desktop is running
- Check if PostgreSQL container is running: `docker ps`
- Wait a few seconds after starting the container
- Verify DATABASE_URL in .env.local

#### 3. **Prisma Client Not Generated**
```
Error: @prisma/client did not initialize yet
```
**Solution:**
```bash
npx prisma generate
```

#### 4. **Node Modules Issues**
```
Error: Cannot find module 'xyz'
```
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 5. **Build Errors**
```
Error: Module not found
```
**Solutions:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies
- Check TypeScript errors: `npm run type-check`

### Docker Issues

#### Container Won't Start
```bash
# Check container logs
docker logs school-postgres

# Remove and restart container
docker rm -f school-postgres
docker-compose up -d
```

#### Database Data Persistence
- Database data persists in Docker volumes
- To reset database: `docker-compose down -v` then `docker-compose up -d`

### Network Issues

#### Cannot Access localhost:3000
- Check if development server is running
- Try different port: `npm run dev -- -p 3001`
- Check firewall settings

#### Socket.IO Connection Issues
- Ensure Socket.IO server is running on port 3001
- Check CORS settings in socket configuration

## Environment-Specific Setup

### Development Environment
- Use `.env.local` for local development
- Enable debug logging
- Use development database

### Production Environment
- Set `NODE_ENV=production`
- Use production database URL
- Set secure JWT secrets
- Configure proper email settings
- Set up file storage (AWS S3, etc.)
- Enable HTTPS

### Testing Environment
- Use separate database for testing
- Set up test-specific environment variables
- Run tests with: `npm test`

## Additional Configuration

### VS Code Extensions (Recommended)
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Prisma
- Docker
- GitLens

### Git Hooks (Optional)
Set up pre-commit hooks for code quality:
```bash
npm install --save-dev husky lint-staged
npx husky install
npm set-script prepare "husky install"
npx husky add .husky/pre-commit "npx lint-staged"
```

### Monitoring and Logging
- Check application logs in terminal
- Database logs: `docker logs school-postgres`
- Browser developer tools for client-side debugging

## Getting Help

If you encounter issues:

1. **Check the Documentation:**
   - Read this setup guide thoroughly
   - Check the SYSTEM_OVERVIEW.md and ARCHITECTURE.md files

2. **Common Solutions:**
   - Restart Docker Desktop
   - Clear node_modules and reinstall
   - Check environment variables
   - Verify database connection

3. **Debug Mode:**
   - Set `DEBUG=true` in .env.local for detailed logging
   - Check browser console for client-side errors
   - Check terminal for server-side errors

4. **Community Support:**
   - Check GitHub issues for similar problems
   - Create a new issue with detailed error messages and system information

## Next Steps

After successful setup:

1. **Explore the Application:**
   - Create test users and classes
   - Test all features (attendance, assignments, etc.)
   - Customize the UI and branding

2. **Learn the Codebase:**
   - Read the documentation files in the `docs/` folder
   - Understand the folder structure and architecture
   - Study the Prisma schema and API routes

3. **Contribute:**
   - Follow the existing code style and patterns
   - Write tests for new features
   - Update documentation for changes

4. **Deploy:**
   - Set up production environment
   - Configure CI/CD pipeline
   - Set up monitoring and backups

The School Management System is now ready for development and testing!