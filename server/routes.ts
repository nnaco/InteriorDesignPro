import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage';
import { setupAuth, isAuthenticated } from './googleAuth';
import {
  insertProjectSchema,
  insertTaskSchema,
  insertDocumentSchema,
  insertMessageSchema,
  insertNotificationSchema,
  insertActivitySchema,
  insertUserSchema,
} from '@shared/schema';
import {
  errorHandler,
  asyncHandler,
  validateRequest,
  CustomError,
} from './middleware/errorHandler';
import { setupSecurity } from './middleware/security';
import {
  requestLogger,
  healthCheck,
  monitoringService,
} from './middleware/monitoring';
import { analyticsService } from './services/analyticsService';
import { emailService } from './services/emailService';
import { notificationService } from './services/notificationService';
import { fileService } from './services/fileService';
import { config } from './config/environment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
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
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(
      request.url || '',
      `http://${request.headers.host}`
    );

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

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
              client.send(
                JSON.stringify({
                  type: 'new_message',
                  message: newMessage,
                })
              );
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
  app.get(
    '/api/metrics',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const user = await storage.getUser(req.user.sub);
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
        requestsByEndpoint,
      });
    })
  );

  // Auth routes
  app.get(
    '/api/auth/user',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const userId = req.user.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }
      res.json(user);
    })
  );

  // Development mode auth bypass
  // if (process.env.NODE_ENV === "development") {
  //   app.get('/api/auth/dev-login', asyncHandler(async (req, res) => {
  //     // Create a development user
  //     const devUser = await storage.upsertUser({
  //       id: "dev-user-1",
  //       email: "dev@designflow.com",
  //       firstName: "Development",
  //       lastName: "User",
  //       profileImageUrl: null,
  //     });

  //     // Create a mock session
  //     req.session.userId = devUser.id;
  //     req.session.user = {
  //       claims: {
  //         sub: devUser.id,
  //         email: devUser.email,
  //         first_name: devUser.firstName,
  //         last_name: devUser.lastName,
  //       }
  //     };

  //     res.redirect('/');
  //   }));

  //   // Development auth check that bypasses Replit auth
  //   app.get('/api/auth/user-dev', asyncHandler(async (req: any, res) => {
  //     if (!req.session.userId) {
  //       // Auto-create dev user if not logged in
  //       const devUser = await storage.upsertUser({
  //         id: "dev-user-1",
  //         email: "dev@designflow.com",
  //         firstName: "Development",
  //         lastName: "User",
  //         profileImageUrl: null,
  //       });

  //       req.session.userId = devUser.id;
  //       return res.json(devUser);
  //     }

  //     const user = await storage.getUser(req.session.userId);
  //     if (!user) {
  //       throw new CustomError('User not found', 404);
  //     }

  //     res.json(user);
  //   }));
  // }

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        createdBy: userId,
      });
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
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Failed to create project' });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
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
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      await storage.deleteProject(req.params.id);

      // Create activity
      await storage.createActivity({
        action: `deleted project`,
        entityType: 'project',
        entityId: req.params.id,
        userId,
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ message: 'Failed to delete project' });
    }
  });

  app.get('/api/projects/:id/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error('Error fetching project members:', error);
      res.status(500).json({ message: 'Failed to fetch project members' });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.query;
      const userId = req.user.sub;
      const tasks = await storage.getTasks(projectId as string, userId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const taskData = insertTaskSchema.parse({
        ...req.body,
        createdBy: userId,
      });
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
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
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
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      await storage.deleteTask(req.params.id);

      // Create activity
      await storage.createActivity({
        action: `deleted task`,
        entityType: 'task',
        entityId: req.params.id,
        userId,
      });

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Failed to delete task' });
    }
  });

  // User/Team routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        email: req.body.email.toLowerCase(),
      });
      await storage.createUser(userData);
      res.json(null);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  app.put('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const documents = await storage.getDocuments(projectId as string);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  app.post(
    '/api/documents/upload',
    isAuthenticated,
    upload.single('file'),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.sub;
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
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Failed to upload document' });
      }
    }
  );

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
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

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  });

  // Message routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.get(
    '/api/messages/:conversationId',
    isAuthenticated,
    async (req, res) => {
      try {
        const messages = await storage.getMessages(req.params.conversationId);
        if (messages.length) {
          await storage.markConversationAsRead(req.params.conversationId);
        }
        res.json(messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
      }
    }
  );

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Analytics routes
  app.get(
    '/api/analytics',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { startDate, endDate, userId } = req.query;
      const analytics = await analyticsService.getComprehensiveAnalytics(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        userId
      );
      res.json(analytics);
    })
  );

  app.get(
    '/api/dashboard/stats',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const [projects, tasks, documents] = await Promise.all([
        storage.getProjects(),
        storage.getTasks(),
        storage.getDocuments(),
      ]);

      const stats = {
        activeProjects: projects
          .filter((p) => p.status === 'active')
          .length.toString(),
        pendingTasks: tasks
          .filter((t) => t.status !== 'done')
          .length.toString(),
        completedTasks: tasks
          .filter((t) => t.status === 'done')
          .length.toString(),
        totalDocuments: documents.length.toString(),
      };

      res.json(stats);
    })
  );

  // Notification routes
  app.get(
    '/api/notifications',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const notifications = await storage.getNotifications(req.user.sub);
      res.json(notifications);
    })
  );

  app.patch(
    '/api/notifications/:id/read',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    })
  );

  app.post(
    '/api/notifications/mark-all-read',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      await storage.markAllNotificationsAsRead(req.user.sub);
      res.json({ success: true });
    })
  );

  // File management enhancement routes
  app.get(
    '/api/documents/:id/versions',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const versions = await fileService.getFileVersions(req.params.id);
      res.json(versions);
    })
  );

  app.post(
    '/api/documents/:id/versions',
    isAuthenticated,
    upload.single('file'),
    asyncHandler(async (req: any, res) => {
      if (!req.file) {
        throw new CustomError('No file uploaded', 400);
      }

      const versionId = await fileService.createFileVersion(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        req.user.sub
      );

      res.json({ id: versionId, success: true });
    })
  );

  app.get(
    '/api/documents/:id/organize',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const organized = await fileService.organizeFiles(req.params.id);
      res.json(organized);
    })
  );

  app.get(
    '/api/storage/stats',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { projectId } = req.query;
      const stats = await fileService.getStorageStats(projectId);
      res.json(stats);
    })
  );

  // User management routes
  app.get(
    '/api/users',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const users = await storage.getUsers();
      res.json(users);
    })
  );

  app.put(
    '/api/users/:id/role',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const currentUser = await storage.getUser(req.user.sub);
      if (currentUser?.role !== 'admin') {
        throw new CustomError('Insufficient permissions', 403);
      }

      const { role } = req.body;
      if (
        !['admin', 'manager', 'designer', 'contractor', 'client'].includes(role)
      ) {
        throw new CustomError('Invalid role', 400);
      }

      await storage.updateUserRole(req.params.id, role);
      res.json({ success: true });
    })
  );

  // Time tracking routes
  app.get(
    '/api/time-tracking/active',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const activeEntry = await storage.getActiveTimeEntry(req.user.sub);
      res.json(activeEntry || null);
    })
  );

  app.post(
    '/api/time-tracking/start',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { taskId, description } = req.body;
      const userId = req.user.sub;

      // Stop any existing active entries
      const existingEntry = await storage.getActiveTimeEntry(userId);
      if (existingEntry) {
        const now = new Date();
        const duration = Math.floor(
          (now.getTime() - new Date(existingEntry.startTime).getTime()) / 1000
        );
        await storage.stopTimeEntry(existingEntry.id, now, duration);
      }

      // Get task and project info
      const task = await storage.getTask(taskId);
      if (!task) {
        throw new CustomError('Task not found', 404);
      }

      const timeEntry = await storage.createTimeEntry({
        taskId,
        projectId: task.projectId!,
        userId,
        startTime: new Date(),
        description,
        isRunning: true,
      });

      res.json(timeEntry);
    })
  );

  app.put(
    '/api/time-tracking/:id/stop',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { id } = req.params;
      const now = new Date();

      const entries = await storage.getTimeEntries({
        userId: req.user.sub,
      });
      const entry = entries.find((e) => e.id === id);

      if (!entry || !entry.isRunning) {
        throw new CustomError('Active time entry not found', 404);
      }

      const duration = Math.floor(
        (now.getTime() - new Date(entry.startTime).getTime()) / 1000
      );
      await storage.stopTimeEntry(id, now, duration);

      res.json({ success: true });
    })
  );

  app.get(
    '/api/time-tracking/entries',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { taskId, projectId } = req.query;
      const entries = await storage.getTimeEntries({
        taskId,
        projectId,
        userId: req.user.sub,
      });
      res.json(entries);
    })
  );

  // Invoice routes
  app.get(
    '/api/invoices',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { projectId } = req.query;
      const invoices = await storage.getInvoices({ projectId });
      res.json(invoices);
    })
  );

  app.post(
    '/api/invoices',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { items, ...invoiceData } = req.body;

      // Generate invoice number
      const invoiceNumber = `INV-${nanoid(10)}`;

      const invoice = await storage.createInvoice({
        ...invoiceData,
        dueDate: new Date(invoiceData.dueDate),
        invoiceNumber,
        issueDate: new Date(),
      });

      // Create invoice items
      if (items && items.length > 0) {
        for (const item of items) {
          await storage.createInvoiceItem({
            ...item,
            invoiceId: invoice.id,
          });
        }
      }

      res.json(invoice);
    })
  );

  app.get(
    '/api/invoices/:id/items',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const items = await storage.getInvoiceItems(req.params.id);
      res.json(items);
    })
  );

  // Project template routes
  app.get(
    '/api/project-templates',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const templates = await storage.getProjectTemplates();
      res.json(templates);
    })
  );

  app.post(
    '/api/project-templates',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { tasks, milestones, ...templateData } = req.body;

      const template = await storage.createProjectTemplate({
        ...templateData,
        createdBy: req.user.sub,
      });

      if (tasks && tasks.length > 0) {
        const templateTasks = tasks.map((task: any, index: number) => ({
          ...task,
          templateId: template.id,
          orderIndex: index,
        }));
        await storage.createTemplateTasks(templateTasks);
      }

      if (milestones && milestones.length > 0) {
        const templateMilestones = milestones.map(
          (milestone: any, index: number) => ({
            ...milestone,
            templateId: template.id,
            orderIndex: index,
          })
        );
        await storage.createTemplateMilestones(templateMilestones);
      }

      res.json(template);
    })
  );

  app.post(
    '/api/projects/from-template',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const { templateId, projectName, clientId, startDate } = req.body;

      const template = await storage.getProjectTemplate(templateId);
      if (!template) {
        throw new CustomError('Template not found', 404);
      }

      // Create project from template
      const project = await storage.createProject({
        name: projectName,
        description: template.description || '',
        clientId,
        createdBy: req.user.sub,
        status: 'planning',
        budget: template.estimatedBudget ? Number(template.estimatedBudget) : 0,
        startDate: new Date(startDate),
        dueDate: new Date(
          Date.now() + (template.estimatedDuration || 30) * 24 * 60 * 60 * 1000
        ),
      });

      // Create tasks from template
      const templateTasks = await storage.getTemplateTasks(templateId);
      for (const templateTask of templateTasks) {
        await storage.createTask({
          title: templateTask.title,
          description: templateTask.description || '',
          projectId: project.id,
          status: 'todo',
          priority: templateTask.priority || 'medium',
          assigneeId: req.user.sub,
          createdBy: req.user.sub,
        });
      }

      // Increment template usage
      await storage.incrementTemplateUsage(templateId);

      res.json(project);
    })
  );

  app.get(
    '/api/project-templates/:id/tasks',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const tasks = await storage.getTemplateTasks(req.params.id);
      res.json(tasks);
    })
  );

  app.get(
    '/api/project-templates/:id/milestones',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const milestones = await storage.getTemplateMilestones(req.params.id);
      res.json(milestones);
    })
  );

  // Client portal routes
  app.get(
    '/api/client-portal/projects/:clientId',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const projects = await storage.getClientProjects(req.params.clientId);
      res.json(projects);
    })
  );

  app.get(
    '/api/client-portal/documents/:clientId',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const documents = await storage.getClientDocuments(req.params.clientId);
      res.json(documents);
    })
  );

  app.get(
    '/api/client-portal/invoices/:clientId',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const invoices = await storage.getClientInvoices(req.params.clientId);
      res.json(invoices);
    })
  );

  app.get(
    '/api/client-portal/messages/:clientId',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const messages = await storage.getConversationMessages(
        req.params.clientId
      );
      res.json(messages);
    })
  );

  app.post(
    '/api/client-portal/access',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const access = await storage.createClientPortalAccess(req.body);
      res.json(access);
    })
  );

  // Add clients endpoint
  app.get(
    '/api/clients',
    isAuthenticated,
    asyncHandler(async (req: any, res) => {
      const clients = await storage.getUsers();
      const clientUsers = clients.filter((user) => user.role === 'client');
      res.json(
        clientUsers.map((client) => ({
          id: client.id,
          name:
            `${client.firstName || ''} ${client.lastName || ''}`.trim() ||
            client.email,
          email: client.email,
        }))
      );
    })
  );

  // Add global error handler at the end
  app.use(errorHandler);

  return httpServer;
}
