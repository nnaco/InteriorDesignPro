# DesignFlow - Interior Design Project Management Platform

## Overview

DesignFlow is a full-stack enterprise web application designed for interior design firms. It serves as a centralized platform for managing projects, scheduling tasks, resource allocation, milestone tracking, and team collaboration. The system emphasizes usability, real-time communication, timeline management, secure document handling, and supports multi-tenant usage with role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system variables
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Real-time Communication**: WebSocket support for live messaging
- **File Handling**: Multer for file uploads with local storage

### Data Storage
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Session Storage**: PostgreSQL sessions table using connect-pg-simple
- **File Storage**: Local filesystem with 50MB upload limit
- **Schema Management**: Drizzle Kit for migrations and schema changes

## Key Components

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC integration
- **Session Management**: Express sessions stored in PostgreSQL
- **Role-based Access**: Manager, Designer, Contractor, Client, Admin roles
- **Security**: HTTP-only cookies, CSRF protection, secure headers

### Project Management
- **Project Lifecycle**: Planning → Active → On Hold → Completed
- **Resource Tracking**: Budget management, progress tracking, timeline management
- **Team Assignment**: Project members with role-based permissions
- **Client Management**: Client information and project association

### Task Management
- **Kanban Board**: Drag-and-drop interface with status columns (To Do, In Progress, Review, Done)
- **Task Assignment**: Individual and team task allocation
- **Priority System**: High, Medium, Low priority levels
- **Due Date Tracking**: Deadline management with overdue notifications

### Document Management
- **File Upload**: Multi-file upload with drag-and-drop interface
- **File Types**: Support for images, PDFs, design files, and documents
- **Project Association**: Documents linked to specific projects
- **Version Control**: File metadata and version tracking

### Real-time Communication
- **WebSocket Integration**: Live messaging between team members
- **Notification System**: Real-time updates for project and task changes
- **Activity Feed**: System-wide activity tracking and display

## Data Flow

### Authentication Flow
1. User accesses application → Redirected to Replit Auth
2. Successful authentication → User session created in PostgreSQL
3. User data upserted in users table
4. Role-based access control applied to subsequent requests

### Project Workflow
1. Project creation with initial metadata and team assignment
2. Task creation and assignment to project members
3. Document upload and association with projects
4. Real-time updates broadcasted via WebSocket
5. Progress tracking and milestone management

### Communication Flow
1. WebSocket connection established on user login
2. Messages sent through WebSocket server
3. Message persistence in PostgreSQL database
4. Real-time delivery to connected clients
5. Notification system for offline users

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Environment**: Development and deployment platform
- **WebSocket**: Native Node.js WebSocket implementation

### UI & Frontend Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation and formatting
- **React Query**: Server state management

### Backend Libraries
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database toolkit
- **Multer**: File upload middleware
- **Passport**: Authentication middleware

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR
- **Database**: Neon PostgreSQL instance
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS
- **File Storage**: Local uploads directory

### Production Build
- **Frontend Build**: Vite production build with static asset optimization
- **Backend Build**: ESBuild compilation to single JavaScript file
- **Asset Serving**: Express static file serving for production
- **Database Migrations**: Drizzle Kit push for schema updates

### Scaling Considerations
- **Database**: Neon serverless automatically scales PostgreSQL
- **File Storage**: Currently local storage (should migrate to cloud storage for production)
- **WebSocket**: Single server instance (consider clustering for high availability)
- **Session Storage**: PostgreSQL-based sessions support horizontal scaling

### Security Measures
- **Authentication**: OIDC with secure session management
- **CORS**: Configured for Replit domains
- **File Upload**: Size limits and type validation
- **Database**: Parameterized queries via Drizzle ORM
- **Environment**: Secure environment variable management