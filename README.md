# DesignFlow - Interior Design Project Management Platform

DesignFlow is a comprehensive full-stack enterprise web application designed specifically for interior design firms. It provides a centralized platform for managing projects, scheduling tasks, resource allocation, milestone tracking, and team collaboration with real-time communication capabilities.

## 🚀 Features

### 🔐 Authentication & Authorization

- **Replit Auth Integration**: Secure OIDC-based authentication
- **Role-Based Access Control**: Support for Admin, Manager, Designer, Contractor, and Client roles
- **Session Management**: Secure session handling with PostgreSQL storage

### 📊 Project Management

- **Project Lifecycle Management**: Planning → Active → On Hold → Completed states
- **Resource Tracking**: Budget management and progress monitoring
- **Team Assignment**: Role-based project member allocation
- **Client Management**: Integrated client information and project association

### ✅ Task Management

- **Kanban Board Interface**: Drag-and-drop task organization
- **Priority System**: High, Medium, Low priority levels
- **Due Date Tracking**: Deadline management with overdue notifications
- **Task Assignment**: Individual and team task allocation

### 📁 Document Management

- **Multi-file Upload**: Drag-and-drop interface with version control
- **File Organization**: Category-based document sorting
- **Version Control**: Complete file versioning system
- **File Type Support**: Images, PDFs, CAD files, 3D models, and more

### 💬 Real-time Communication

- **WebSocket Integration**: Live messaging between team members
- **Notification System**: Real-time project and task updates
- **Activity Feed**: System-wide activity tracking

### 📧 Email Notifications

- **Project Assignment**: Automated project assignment notifications
- **Task Reminders**: Due date and overdue task alerts
- **Status Updates**: Project and task status change notifications
- **Customizable Templates**: Professional email templates

### 📈 Advanced Analytics

- **Performance Metrics**: Project completion rates and average durations
- **User Productivity**: Task completion analytics and user activity
- **Time Series Data**: Historical trends and patterns
- **Interactive Charts**: Comprehensive data visualizations

### 📱 Mobile Optimization

- **Responsive Design**: Mobile-first approach with touch-optimized components
- **Swipe Gestures**: Native mobile interactions
- **Adaptive UI**: Components that adjust to screen size and device type

## 🛠 Technology Stack

### Frontend

- **React 18** with TypeScript
- **Wouter** for client-side routing
- **Shadcn/UI** components built on Radix UI primitives
- **Tailwind CSS** with custom design system
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
- **Framer Motion** for animations

### Backend

- **Node.js** with Express.js framework
- **TypeScript** with ES modules
- **PostgreSQL** with Neon serverless driver
- **Drizzle ORM** for type-safe database operations
- **WebSocket** for real-time communication
- **Multer** for file upload handling
- **SendGrid** for email notifications

### Infrastructure

- **Replit** for development and hosting
- **PostgreSQL** database with session storage
- **File Storage** with versioning support
- **Rate Limiting** and security middleware

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- SendGrid API key (for email notifications)
- Replit account (for authentication)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd designflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file with the following variables:

```env
# Required
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
REPLIT_DOMAINS=your_replit_domain.replit.dev
REPL_ID=your_repl_id

# Optional but Recommended
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourapp.com
APP_URL=https://yourapp.com

# File Upload (Optional)
MAX_FILE_SIZE=50MB
MAX_FILES_PER_PROJECT=100

# Security (Optional)
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 4. Database Setup

```bash
# Push database schema
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📖 API Documentation

### Authentication Endpoints

```
GET  /api/login        # Initiate login flow
GET  /api/callback     # OAuth callback
GET  /api/logout       # Logout user
GET  /api/auth/user    # Get current user
```

### Project Management

```
GET    /api/projects           # Get all projects
POST   /api/projects           # Create project
GET    /api/projects/:id       # Get project by ID
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project
GET    /api/projects/:id/members # Get project members
POST   /api/projects/:id/members # Add project member
```

### Task Management

```
GET    /api/tasks              # Get all tasks
POST   /api/tasks              # Create task
GET    /api/tasks/:id          # Get task by ID
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
PATCH  /api/tasks/:id/status   # Update task status
```

### Document Management

```
GET    /api/documents          # Get documents
POST   /api/documents          # Upload document
GET    /api/documents/:id      # Get document
DELETE /api/documents/:id      # Delete document
GET    /api/documents/:id/versions # Get file versions
POST   /api/documents/:id/versions # Create new version
```

### Communication

```
GET    /api/conversations      # Get conversations
POST   /api/messages           # Send message
GET    /api/messages/:id       # Get conversation messages
PATCH  /api/messages/:id/read  # Mark as read
```

### Analytics

```
GET    /api/analytics          # Get comprehensive analytics
GET    /api/dashboard/stats    # Get dashboard statistics
GET    /api/health            # System health check
```

### User Management

```
GET    /api/users              # Get all users
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id/role     # Update user role (Admin only)
```

### Notifications

```
GET    /api/notifications      # Get user notifications
PATCH  /api/notifications/:id/read # Mark notification as read
POST   /api/notifications/mark-all-read # Mark all as read
```

## 🏗 Architecture

### Frontend Architecture

```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Shadcn/UI)
│   ├── layout/         # Layout components
│   ├── analytics/      # Analytics components
│   └── ErrorBoundary.tsx
├── pages/              # Application pages
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
└── App.tsx             # Main application component
```

### Backend Architecture

```
server/
├── config/             # Environment configuration
├── middleware/         # Express middleware
├── services/           # Business logic services
│   ├── emailService.ts
│   ├── analyticsService.ts
│   ├── fileService.ts
│   └── notificationService.ts
├── routes.ts          # API route definitions
├── storage.ts         # Database operations
├── db.ts             # Database connection
└── index.ts          # Server entry point
```

### Database Schema

```
shared/schema.ts        # Drizzle schema definitions
```

Key tables:

- `users` - User accounts and authentication
- `projects` - Project management
- `tasks` - Task tracking
- `documents` - File management
- `messages` - Communication system
- `notifications` - Notification system
- `sessions` - Session storage

## 🔒 Security Features

### Authentication & Authorization

- OIDC-compliant authentication via Replit
- Role-based access control (RBAC)
- Secure session management with HTTP-only cookies
- CSRF protection

### API Security

- Rate limiting on all endpoints
- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM
- File upload security with type validation

### Infrastructure Security

- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Environment variable protection
- Secure file storage with path traversal protection

## 📊 Performance & Monitoring

### Performance Features

- Database query optimization
- Efficient file storage with checksums
- Response time monitoring
- Memory usage tracking

### Monitoring & Logging

- Request/response logging
- Error tracking and reporting
- Health check endpoints
- Performance metrics collection

## 🚀 Deployment

### Production Environment Variables

Ensure all required environment variables are set:

- `NODE_ENV=production`
- Database credentials
- Email service configuration
- Security keys and secrets

### Database Migration

```bash
npm run db:push
```

### Build and Start

```bash
npm run build
npm start
```

### Health Monitoring

Monitor application health via:

- `GET /api/health` - Application health status
- System metrics and error rates
- Database connection status

## 🔧 Development

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Consistent naming conventions
- Comprehensive type definitions

### Testing

- Error boundaries for React components
- Input validation on all endpoints
- Comprehensive error handling
- Database transaction management

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Update database schema
npm run db:studio    # Open Drizzle Studio
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit changes: `git commit -m 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API endpoints above

## 🎯 Roadmap

### Upcoming Features

- [ ] Advanced reporting dashboard
- [ ] Gantt chart project visualization
- [ ] Time tracking integration
- [ ] Invoice generation
- [ ] Client portal enhancements
- [ ] Mobile app development
- [ ] Third-party integrations (Google Drive, Dropbox)
- [ ] Advanced user permissions
- [ ] Project templates
- [ ] Automated backup system

---

Built with ❤️ for interior design professionals using modern web technologies.
