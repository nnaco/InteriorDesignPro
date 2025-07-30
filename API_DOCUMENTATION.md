# DesignFlow API Documentation

This document provides comprehensive information about the DesignFlow API endpoints, request/response formats, and authentication requirements.

## Base URL

```
https://your-designflow-domain.replit.dev/api
```

## Authentication

All API endpoints (except `/health`) require authentication via session cookies. Users must first authenticate through the Replit Auth flow.

### Authentication Flow

1. Navigate to `/api/login` to initiate authentication
2. Complete Replit OAuth flow
3. User is redirected with session cookie
4. Use session cookie for subsequent API requests

### Session Management

```http
GET /api/auth/user
```

**Response:**

```json
{
  "id": "4350992",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "manager",
  "profileImageUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Project Management API

### Get All Projects

```http
GET /api/projects
```

**Query Parameters:**

- `status` (optional): Filter by project status (`planning`, `active`, `on_hold`, `completed`)
- `limit` (optional): Number of projects to return (default: 50)
- `offset` (optional): Number of projects to skip (default: 0)

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Modern Living Room Design",
    "description": "Complete living room renovation project",
    "status": "active",
    "clientName": "Jane Smith",
    "clientEmail": "jane@example.com",
    "clientPhone": "+1-555-0123",
    "budget": 25000.0,
    "startDate": "2024-01-15",
    "endDate": "2024-03-15",
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Create Project

```http
POST /api/projects
```

**Request Body:**

```json
{
  "name": "Modern Kitchen Renovation",
  "description": "Complete kitchen makeover with modern appliances",
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "clientPhone": "+1-555-0124",
  "budget": 45000.0,
  "startDate": "2024-02-01",
  "endDate": "2024-04-01"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Modern Kitchen Renovation",
  "status": "planning"
  // ... other fields
}
```

### Get Project by ID

```http
GET /api/projects/:id
```

**Response:** Same as project object above

### Update Project

```http
PUT /api/projects/:id
```

**Request Body:** Partial project object with fields to update

### Delete Project

```http
DELETE /api/projects/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Project Members

#### Get Project Members

```http
GET /api/projects/:id/members
```

**Response:**

```json
[
  {
    "id": "member_id",
    "projectId": "project_id",
    "userId": "user_id",
    "role": "designer",
    "createdAt": "2024-01-15T10:30:00Z",
    "user": {
      "id": "user_id",
      "email": "designer@example.com",
      "firstName": "Alice",
      "lastName": "Johnson"
    }
  }
]
```

#### Add Project Member

```http
POST /api/projects/:id/members
```

**Request Body:**

```json
{
  "userId": "user_id",
  "role": "designer"
}
```

---

## Task Management API

### Get All Tasks

```http
GET /api/tasks
```

**Query Parameters:**

- `projectId` (optional): Filter by project
- `assigneeId` (optional): Filter by assignee
- `status` (optional): Filter by status (`todo`, `in_progress`, `review`, `done`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)

**Response:**

```json
[
  {
    "id": "task_id",
    "title": "Design mood board",
    "description": "Create initial mood board for living room",
    "status": "in_progress",
    "priority": "high",
    "projectId": "project_id",
    "assigneeId": "user_id",
    "dueDate": "2024-01-20",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-16T14:30:00Z"
  }
]
```

### Create Task

```http
POST /api/tasks
```

**Request Body:**

```json
{
  "title": "Select paint colors",
  "description": "Choose paint colors for all rooms",
  "projectId": "project_id",
  "assigneeId": "user_id",
  "priority": "medium",
  "dueDate": "2024-01-25"
}
```

### Update Task

```http
PUT /api/tasks/:id
```

**Request Body:** Partial task object

### Update Task Status

```http
PATCH /api/tasks/:id/status
```

**Request Body:**

```json
{
  "status": "done"
}
```

### Delete Task

```http
DELETE /api/tasks/:id
```

---

## Document Management API

### Get Documents

```http
GET /api/documents
```

**Query Parameters:**

- `projectId` (optional): Filter by project

**Response:**

```json
[
  {
    "id": "doc_id",
    "filename": "floor_plan_v2.pdf",
    "originalName": "Living Room Floor Plan.pdf",
    "mimeType": "application/pdf",
    "size": 2048576,
    "projectId": "project_id",
    "uploadedBy": "user_id",
    "description": "Updated floor plan with measurements",
    "fileType": "pdf",
    "filePath": "/uploads/floor_plan_v2.pdf",
    "version": 1,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### Upload Document

```http
POST /api/documents
```

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `file`: File to upload
- `projectId`: Project ID
- `description`: File description (optional)

### Get Document

```http
GET /api/documents/:id
```

Downloads the file content.

### Get Document Versions

```http
GET /api/documents/:id/versions
```

**Response:**

```json
[
  {
    "id": "version_id",
    "version": 2,
    "filename": "floor_plan_v2.pdf",
    "createdAt": "2024-01-16T10:00:00Z",
    "createdBy": "user_id"
  }
]
```

### Create Document Version

```http
POST /api/documents/:id/versions
```

**Content-Type:** `multipart/form-data`

### Delete Document

```http
DELETE /api/documents/:id
```

---

## Communication API

### Get Conversations

```http
GET /api/conversations
```

**Response:**

```json
[
  {
    "conversationId": "conv_id",
    "otherUserId": "user_id",
    "lastMessage": "Let's review the color scheme",
    "lastMessageTime": "2024-01-15T15:30:00Z",
    "isRead": false
  }
]
```

### Send Message

```http
POST /api/messages
```

**Request Body:**

```json
{
  "recipientId": "user_id",
  "content": "The mood board looks great!",
  "conversationId": "conv_id"
}
```

### Get Conversation Messages

```http
GET /api/messages/:conversationId
```

**Response:**

```json
[
  {
    "id": "message_id",
    "conversationId": "conv_id",
    "senderId": "user_id",
    "recipientId": "user_id",
    "content": "What do you think of these colors?",
    "isRead": true,
    "createdAt": "2024-01-15T14:30:00Z"
  }
]
```

### Mark Message as Read

```http
PATCH /api/messages/:id/read
```

---

## User Management API

### Get All Users

```http
GET /api/users
```

**Response:**

```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "designer",
    "profileImageUrl": "https://...",
    "createdAt": "2024-01-10T10:00:00Z"
  }
]
```

### Update User Role (Admin Only)

```http
PUT /api/users/:id/role
```

**Request Body:**

```json
{
  "role": "manager"
}
```

---

## Notification API

### Get User Notifications

```http
GET /api/notifications
```

**Response:**

```json
[
  {
    "id": "notification_id",
    "userId": "user_id",
    "type": "task_assigned",
    "title": "New Task Assignment",
    "message": "You have been assigned a new task: Design mood board",
    "isRead": false,
    "metadata": {
      "taskId": "task_id",
      "projectName": "Modern Living Room"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### Mark Notification as Read

```http
PATCH /api/notifications/:id/read
```

### Mark All Notifications as Read

```http
POST /api/notifications/mark-all-read
```

---

## Analytics API

### Get Comprehensive Analytics

```http
GET /api/analytics
```

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `userId` (optional): Filter for specific user

**Response:**

```json
{
  "overview": {
    "totalProjects": 15,
    "activeProjects": 8,
    "completedProjects": 7,
    "totalTasks": 142,
    "completedTasks": 98,
    "totalUsers": 12,
    "totalDocuments": 234,
    "totalMessages": 1056
  },
  "projectMetrics": {
    "projectsByStatus": [
      { "status": "active", "count": 8 },
      { "status": "completed", "count": 7 }
    ],
    "projectsCompletionRate": 46.7,
    "averageProjectDuration": 45
  },
  "taskMetrics": {
    "tasksByStatus": [
      { "status": "done", "count": 98 },
      { "status": "in_progress", "count": 32 }
    ],
    "tasksByPriority": [
      { "priority": "high", "count": 23 },
      { "priority": "medium", "count": 67 }
    ],
    "taskCompletionRate": 69.0,
    "overdueTasks": 5,
    "averageTaskCompletionTime": 3
  },
  "userMetrics": {
    "usersByRole": [
      { "role": "designer", "count": 6 },
      { "role": "manager", "count": 3 }
    ],
    "mostActiveUsers": [
      {
        "userId": "user_id",
        "email": "alice@example.com",
        "taskCount": 23
      }
    ],
    "userProductivity": [
      {
        "userId": "user_id",
        "email": "alice@example.com",
        "completedTasks": 18
      }
    ]
  },
  "timeSeriesData": {
    "projectsCreatedOverTime": [{ "date": "2024-01-15", "count": 2 }],
    "tasksCompletedOverTime": [{ "date": "2024-01-15", "count": 8 }],
    "documentsUploadedOverTime": [{ "date": "2024-01-15", "count": 12 }]
  }
}
```

### Get Dashboard Statistics

```http
GET /api/dashboard/stats
```

**Response:**

```json
{
  "activeProjects": "8",
  "pendingTasks": "44",
  "completedTasks": "98",
  "totalDocuments": "234"
}
```

---

## System Health API

### Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "details": {
    "uptime": 86400000,
    "memoryUsage": 75.2,
    "errorRate": 0.5,
    "avgResponseTime": 245,
    "activeConnections": 12
  }
}
```

### Get System Metrics (Admin Only)

```http
GET /api/metrics
```

**Response:**

```json
{
  "requestCount": 15420,
  "averageResponseTime": 245,
  "errorCount": 23,
  "activeConnections": 12,
  "memoryUsage": {
    "heapUsed": 52428800,
    "heapTotal": 69206016,
    "external": 1089024
  },
  "uptime": 86400000
}
```

---

## Error Responses

All API endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Something went wrong!"
}
```

---

## Rate Limits

- **General API**: 1000 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **File uploads**: Subject to file size limits (50MB default)

## WebSocket API

### Connection

Connect to WebSocket at: `wss://your-domain/ws`

### Events

#### Message Sent

```json
{
  "type": "message",
  "data": {
    "id": "message_id",
    "conversationId": "conv_id",
    "senderId": "user_id",
    "content": "Hello!",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Notification

```json
{
  "type": "notification",
  "data": {
    "id": "notification_id",
    "title": "New Task Assignment",
    "message": "You have been assigned a new task"
  }
}
```

#### User Status

```json
{
  "type": "user_status",
  "data": {
    "userId": "user_id",
    "status": "online"
  }
}
```

---

## Data Models

### User Roles

- `admin`: Full system access
- `manager`: Project and team management
- `designer`: Design tasks and collaboration
- `contractor`: Task execution and updates
- `client`: View-only access to their projects

### Project Status

- `planning`: Project in planning phase
- `active`: Project currently in progress
- `on_hold`: Project temporarily paused
- `completed`: Project finished

### Task Status

- `todo`: Task not started
- `in_progress`: Task being worked on
- `review`: Task pending review
- `done`: Task completed

### File Types

- `image`: Image files (jpg, png, gif, etc.)
- `pdf`: PDF documents
- `cad`: CAD files (dwg, dxf)
- `3d`: 3D model files
- `document`: Other document types

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('/api/projects', {
  method: 'GET',
  credentials: 'include', // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

const projects = await response.json();
```

### File Upload Example

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('projectId', 'project-id');
formData.append('description', 'Floor plan revision');

const response = await fetch('/api/documents', {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

---

This documentation covers all available API endpoints in the DesignFlow application. For additional support or questions, please refer to the main README.md or create an issue in the repository.
