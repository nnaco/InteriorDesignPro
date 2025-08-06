import {
  users,
  projects,
  tasks,
  documents,
  messages,
  notifications,
  activities,
  projectMembers,
  timeEntries,
  invoices,
  invoiceItems,
  projectTemplates,
  templateTasks,
  templateMilestones,
  clientPortalAccess,
  type User,
  type InsertUser,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Document,
  type InsertDocument,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type Activity,
  type InsertActivity,
  type ProjectMember,
  type TimeEntry,
  type InsertTimeEntry,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type ProjectTemplate,
  type InsertProjectTemplate,
  type TemplateTask,
  type InsertTemplateTask,
  type TemplateMilestone,
  type InsertTemplateMilestone,
  type ClientPortalAccess,
  type InsertClientPortalAccess,
} from '@shared/schema';
import { db } from './db';
import {
  eq,
  desc,
  and,
  or,
  ilike,
  sql,
  ne,
  gte,
  lte,
  inArray,
} from 'drizzle-orm';

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;

  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProjects(userId?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getProjectMembers(
    projectId: string
  ): Promise<(ProjectMember & { user: User })[]>;
  addProjectMember(
    projectId: string,
    userId: string,
    role?: string
  ): Promise<void>;

  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(projectId?: string, userId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTasksByStatus(status: string): Promise<Task[]>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(projectId?: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversations(userId: string): Promise<any[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  markConversationAsRead(id: string): Promise<void>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(limit?: number): Promise<Activity[]>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserOnRegistration(
    id: string,
    data: Pick<UpsertUser, 'profileImageUrl' | 'sub'>
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ hasJoined: true, updatedAt: new Date(), ...data })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(users.firstName, users.lastName);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProjects(userId?: string): Promise<Project[]> {
    if (userId) {
      return await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          clientName: projects.clientName,
          status: projects.status,
          budget: projects.budget,
          progress: projects.progress,
          startDate: projects.startDate,
          endDate: projects.endDate,
          createdBy: projects.createdBy,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
        .where(
          or(eq(projects.createdBy, userId), eq(projectMembers.userId, userId))
        )
        .orderBy(desc(projects.createdAt));
    }
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async updateProject(
    id: string,
    data: Partial<InsertProject>
  ): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectMembers(
    projectId: string
  ): Promise<(ProjectMember & { user: User })[]> {
    return await db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        user: users,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
  }

  async addProjectMember(
    projectId: string,
    userId: string,
    role = 'member'
  ): Promise<void> {
    await db.insert(projectMembers).values({
      projectId,
      userId,
      role,
    });
  }

  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getTasks(projectId?: string, userId?: string): Promise<Task[]> {
    if (projectId) {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(desc(tasks.createdAt));
    } else if (userId) {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.assigneeId, userId))
        .orderBy(desc(tasks.createdAt));
    }

    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.status, status));
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async getDocuments(projectId?: string): Promise<Document[]> {
    if (projectId) {
      return await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, projectId))
        .orderBy(desc(documents.createdAt));
    }

    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversations(userId: string): Promise<any[]> {
    const conversations = await db
      .select({
        conversationId: messages.conversationId,
        recipientId: messages.recipientId,
        senderId: messages.senderId,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(
        or(eq(messages.senderId, userId), eq(messages.recipientId, userId))
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Group by conversation and get latest message for each
    const grouped = conversations.reduce((acc, msg) => {
      const otherUserId =
        msg.senderId === userId ? msg.recipientId : msg.senderId;
      const key = msg.conversationId || otherUserId;

      if (
        !acc[key] ||
        (msg.lastMessageTime &&
          acc[key]?.lastMessageTime &&
          new Date(msg.lastMessageTime) > new Date(acc[key].lastMessageTime))
      ) {
        acc[key] = { ...msg, otherUserId };
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async markConversationAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.conversationId, id));
  }

  // Notification operations
  async createNotification(
    notification: InsertNotification
  ): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Additional methods needed by services
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getDocumentVersions(documentId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.parentDocumentId, documentId))
      .orderBy(desc(documents.version));
  }

  async getDocumentByChecksum(
    checksum: string,
    projectId: string
  ): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.checksum, checksum),
          eq(documents.projectId, projectId)
        )
      );
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getTasksDueBetween(startDate: Date, endDate: Date): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          gte(tasks.dueDate, startDate.toISOString()),
          lte(tasks.dueDate, endDate.toISOString()),
          ne(tasks.status, 'done')
        )
      );
  }

  async getOverdueTasks(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          lte(tasks.dueDate, new Date().toISOString()),
          ne(tasks.status, 'done')
        )
      );
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getActivities(limit = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<any> {
    const [activeProjects] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(
          eq(projects.status, 'active'),
          or(eq(projects.createdBy, userId), eq(projectMembers.userId, userId))
        )
      );

    const [pendingTasks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.assigneeId, userId),
          or(eq(tasks.status, 'todo'), eq(tasks.status, 'in_progress'))
        )
      );

    const [totalTeamMembers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    return {
      activeProjects: activeProjects.count || 0,
      pendingTasks: pendingTasks.count || 0,
      teamMembers: totalTeamMembers.count || 0,
      budgetUtilization: 68, // This could be calculated based on actual budget data
    };
  }

  // Time Tracking operations
  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [entry] = await db.insert(timeEntries).values(timeEntry).returning();
    return entry;
  }

  async getTimeEntries(filters: {
    taskId?: string;
    projectId?: string;
    userId?: string;
  }): Promise<TimeEntry[]> {
    const conditions = [];
    if (filters.taskId) conditions.push(eq(timeEntries.taskId, filters.taskId));
    if (filters.projectId)
      conditions.push(eq(timeEntries.projectId, filters.projectId));
    if (filters.userId) conditions.push(eq(timeEntries.userId, filters.userId));

    return await db
      .select()
      .from(timeEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(timeEntries.startTime));
  }

  async getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(
        and(eq(timeEntries.userId, userId), eq(timeEntries.isRunning, true))
      );
    return entry;
  }

  async stopTimeEntry(
    entryId: string,
    endTime: Date,
    duration: number
  ): Promise<void> {
    await db
      .update(timeEntries)
      .set({ endTime, duration, isRunning: false })
      .where(eq(timeEntries.id, entryId));
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async getInvoices(filters: {
    projectId?: string;
    clientId?: string;
  }): Promise<Invoice[]> {
    const conditions = [];
    if (filters.projectId)
      conditions.push(eq(invoices.projectId, filters.projectId));
    if (filters.clientId)
      conditions.push(eq(invoices.clientId, filters.clientId));

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt));

    const invoiceIds = invoiceList.map((inv) => inv.id);

    const invoiceItemsList = await db
      .select()
      .from(invoiceItems)
      .where(inArray(invoiceItems.invoiceId, invoiceIds));

    // Group items by invoiceId
    const itemsMap = invoiceItemsList.reduce((acc, item) => {
      if (item.invoiceId) {
        if (!acc[item.invoiceId]) acc[item.invoiceId] = [];
        acc[item.invoiceId].push(item);
      }
      return acc;
    }, {} as Record<string, typeof invoiceItemsList>);

    return invoiceList.map((invoice) => ({
      ...invoice,
      items: itemsMap[invoice.id] || [],
    }));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db.insert(invoiceItems).values(item).returning();
    return newItem;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Project Template operations
  async createProjectTemplate(
    template: InsertProjectTemplate
  ): Promise<ProjectTemplate> {
    const [newTemplate] = await db
      .insert(projectTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return await db
      .select()
      .from(projectTemplates)
      .orderBy(
        desc(projectTemplates.usageCount),
        desc(projectTemplates.createdAt)
      );
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate | undefined> {
    const [template] = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, id));
    return template;
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    await db
      .update(projectTemplates)
      .set({ usageCount: sql`${projectTemplates.usageCount} + 1` })
      .where(eq(projectTemplates.id, id));
  }

  async createTemplateTasks(
    tasks: InsertTemplateTask[]
  ): Promise<TemplateTask[]> {
    return await db.insert(templateTasks).values(tasks).returning();
  }

  async getTemplateTasks(templateId: string): Promise<TemplateTask[]> {
    return await db
      .select()
      .from(templateTasks)
      .where(eq(templateTasks.templateId, templateId))
      .orderBy(templateTasks.orderIndex);
  }

  async createTemplateMilestones(
    milestones: InsertTemplateMilestone[]
  ): Promise<TemplateMilestone[]> {
    return await db.insert(templateMilestones).values(milestones).returning();
  }

  async getTemplateMilestones(
    templateId: string
  ): Promise<TemplateMilestone[]> {
    return await db
      .select()
      .from(templateMilestones)
      .where(eq(templateMilestones.templateId, templateId))
      .orderBy(templateMilestones.orderIndex);
  }

  // Client Portal operations
  async createClientPortalAccess(
    access: InsertClientPortalAccess
  ): Promise<ClientPortalAccess> {
    const [newAccess] = await db
      .insert(clientPortalAccess)
      .values(access)
      .returning();
    return newAccess;
  }

  async getClientPortalAccess(clientId: string): Promise<ClientPortalAccess[]> {
    return await db
      .select()
      .from(clientPortalAccess)
      .where(
        and(
          eq(clientPortalAccess.clientId, clientId),
          eq(clientPortalAccess.isActive, true)
        )
      );
  }

  async getClientProjects(clientId: string): Promise<Project[]> {
    return db
      .select({
        id: projects.id,
        clientName: projects.clientName,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        budget: projects.budget,
        startDate: projects.startDate,
        endDate: projects.endDate,
        dueDate: projects.endDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        progress: projects.progress,
      })
      .from(projects)
      .innerJoin(
        clientPortalAccess,
        eq(projects.id, clientPortalAccess.projectId)
      )
      .where(
        and(
          eq(clientPortalAccess.clientId, clientId),
          eq(clientPortalAccess.isActive, true)
        )
      );
  }

  async getClientDocuments(clientId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .innerJoin(
        clientPortalAccess,
        eq(documents.projectId, clientPortalAccess.projectId)
      )
      .where(
        and(
          eq(clientPortalAccess.clientId, clientId),
          eq(clientPortalAccess.isActive, true)
        )
      );
  }

  async getClientInvoices(clientId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.createdAt));
  }
}

export const storage = new DatabaseStorage();
