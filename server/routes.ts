import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProjectSchema,
  insertTaskSchema,
  insertDocumentSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertActivitySchema,
} from "@shared/schema";
import { errorHandler, asyncHandler, validateRequest, CustomError } from './middleware/errorHandler';
import { setupSecurity } from './middleware/security';
import { requestLogger, healthCheck, monitoringService } from './middleware/monitoring';
import { analyticsService } from './services/analyticsService';
import { emailService } from './services/emailService';
import { notificationService } from './services/notificationService';
import { fileService } from './services/fileService';
import { config } from './config/environment';
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from 'zod';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Security and monitoring middleware
  setupSecurity(app);
  app.use(requestLogger);
  
  // Auth middleware
  await setupAuth(app);

  // WebSocket setup for real-time messaging
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'send_message') {
          // Store message in database
          const newMessage = await storage.createMessage({
            content: data.content,
            senderId: data.senderId,
            recipientId: data.recipientId,
            conversationId: data.conversationId,
          });

          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: newMessage,
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Health check endpoint (no auth required)
  app.get('/api/health', (req, res) => {
    const health = healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  });

  // System metrics (admin only)
  app.get('/api/metrics', isAuthenticated, asyncHandler(async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (user?.role !== 'admin') {
      throw new CustomError('Insufficient permissions', 403);
    }
    
    const metrics = monitoringService.getMetrics();
    const recentLogs = monitoringService.getRecentLogs(100);
    const errorLogs = monitoringService.getErrorLogs(50);
    const requestsByEndpoint = monitoringService.getRequestsByEndpoint();
    
    res.json({
      metrics,
      recentLogs,
      errorLogs,
      requestsByEndpoint
    });
  }));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, asyncHandler(async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  }));

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, createdBy: userId });
      const project = await storage.createProject(projectData);
      
      // Create activity
      await storage.createActivity({
        action: `created project "${project.name}"`,
        entityType: 'project',
        entityId: project.id,
        userId,
      });

      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      
      // Create activity
      await storage.createActivity({
        action: `updated project "${project.name}"`,
        entityType: 'project',
        entityId: project.id,
        userId,
      });

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteProject(req.params.id);
      
      // Create activity
      await storage.createActivity({
        action: `deleted project`,
        entityType: 'project',
        entityId: req.params.id,
        userId,
      });

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  app.get('/api/projects/:id/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.query;
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasks(projectId as string, userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.parse({ ...req.body, createdBy: userId });
      const task = await storage.createTask(taskData);
      
      // Create activity
      await storage.createActivity({
        action: `created task "${task.title}"`,
        entityType: 'task',
        entityId: task.id,
        userId,
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, taskData);
      
      // Create activity
      await storage.createActivity({
        action: `updated task "${task.title}"`,
        entityType: 'task',
        entityId: task.id,
        userId,
      });

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteTask(req.params.id);
      
      // Create activity
      await storage.createActivity({
        action: `deleted task`,
        entityType: 'task',
        entityId: req.params.id,
        userId,
      });

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // User/Team routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const documents = await storage.getDocuments(projectId as string);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const { projectId } = req.body;

      const documentData = {
        name: req.file.originalname,
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        projectId,
        uploadedBy: userId,
      };

      const document = await storage.createDocument(documentData);
      
      // Create activity
      await storage.createActivity({
        action: `uploaded document "${document.name}"`,
        entityType: 'document',
        entityId: document.id,
        userId,
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const document = await storage.getDocument(req.params.id);
      
      if (document) {
        // Delete file from filesystem
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath);
        }
        
        await storage.deleteDocument(req.params.id);
        
        // Create activity
        await storage.createActivity({
          action: `deleted document "${document.name}"`,
          entityType: 'document',
          entityId: document.id,
          userId,
        });
      }

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Message routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:conversationId', isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, asyncHandler(async (req: any, res) => {
    const { startDate, endDate, userId } = req.query;
    const analytics = await analyticsService.getComprehensiveAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      userId
    );
    res.json(analytics);
  }));

  app.get('/api/dashboard/stats', isAuthenticated, asyncHandler(async (req: any, res) => {
    const [projects, tasks, documents] = await Promise.all([
      storage.getProjects(),
      storage.getTasks(),
      storage.getDocuments()
    ]);

    const stats = {
      activeProjects: projects.filter(p => p.status === 'active').length.toString(),
      pendingTasks: tasks.filter(t => t.status !== 'done').length.toString(),
      completedTasks: tasks.filter(t => t.status === 'done').length.toString(),
      totalDocuments: documents.length.toString(),
    };

    res.json(stats);
  }));

  // Notification routes
  app.get('/api/notifications', isAuthenticated, asyncHandler(async (req: any, res) => {
    const notifications = await storage.getNotifications(req.user.claims.sub);
    res.json(notifications);
  }));

  app.patch('/api/notifications/:id/read', isAuthenticated, asyncHandler(async (req: any, res) => {
    await storage.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  }));

  app.post('/api/notifications/mark-all-read', isAuthenticated, asyncHandler(async (req: any, res) => {
    await storage.markAllNotificationsAsRead(req.user.claims.sub);
    res.json({ success: true });
  }));

  // File management enhancement routes
  app.get('/api/documents/:id/versions', isAuthenticated, asyncHandler(async (req: any, res) => {
    const versions = await fileService.getFileVersions(req.params.id);
    res.json(versions);
  }));

  app.post('/api/documents/:id/versions', isAuthenticated, upload.single('file'), asyncHandler(async (req: any, res) => {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400);
    }

    const versionId = await fileService.createFileVersion(
      req.params.id,
      req.file.buffer,
      req.file.originalname,
      req.user.claims.sub
    );

    res.json({ id: versionId, success: true });
  }));

  app.get('/api/documents/:id/organize', isAuthenticated, asyncHandler(async (req: any, res) => {
    const organized = await fileService.organizeFiles(req.params.id);
    res.json(organized);
  }));

  app.get('/api/storage/stats', isAuthenticated, asyncHandler(async (req: any, res) => {
    const { projectId } = req.query;
    const stats = await fileService.getStorageStats(projectId);
    res.json(stats);
  }));

  // User management routes
  app.get('/api/users', isAuthenticated, asyncHandler(async (req: any, res) => {
    const users = await storage.getUsers();
    res.json(users);
  }));

  app.put('/api/users/:id/role', isAuthenticated, asyncHandler(async (req: any, res) => {
    const currentUser = await storage.getUser(req.user.claims.sub);
    if (currentUser?.role !== 'admin') {
      throw new CustomError('Insufficient permissions', 403);
    }

    const { role } = req.body;
    if (!['admin', 'manager', 'designer', 'contractor', 'client'].includes(role)) {
      throw new CustomError('Invalid role', 400);
    }

    await storage.updateUserRole(req.params.id, role);
    res.json({ success: true });
  }));

  // Add global error handler at the end
  app.use(errorHandler);

  return httpServer;
}
