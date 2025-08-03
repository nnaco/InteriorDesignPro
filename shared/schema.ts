import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
  date,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  hasJoined: boolean('has_joined').default(false),
  profileImageUrl: varchar('profile_image_url'),
  role: varchar('role').notNull(), // manager, designer, contractor, client, admin
  sub: varchar('sub').unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  clientName: varchar('client_name', { length: 255 }),
  status: varchar('status').notNull().default('planning'), // planning, active, on_hold, completed
  budget: decimal('budget', { precision: 12, scale: 2 }),
  progress: integer('progress').default(0),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status').notNull().default('todo'), // todo, in_progress, review, done
  priority: varchar('priority').notNull().default('medium'), // low, medium, high
  projectId: uuid('project_id').references(() => projects.id),
  assigneeId: uuid('assignee_id').references(() => users.id),
  dueDate: date('due_date'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  userId: uuid('user_id').references(() => users.id),
  role: varchar('role').default('member'), // lead, member
  createdAt: timestamp('created_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  fileName: varchar('file_name', { length: 255 }),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: integer('file_size'),
  size: integer('size').notNull(),
  filePath: text('file_path').notNull(),
  checksum: varchar('checksum', { length: 64 }),
  version: integer('version').default(1),
  parentDocumentId: uuid('parent_document_id').references(() => documents.id),
  description: text('description').default(''),
  projectId: uuid('project_id').references(() => projects.id),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  senderId: uuid('sender_id').references(() => users.id),
  recipientId: uuid('recipient_id').references(() => users.id),
  conversationId: uuid('conversation_id'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  type: varchar('type').default('info'), // info, success, warning, error
  userId: uuid('user_id').references(() => users.id),
  isRead: boolean('is_read').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type'), // project, task, document
  entityId: uuid('entity_id'),
  userId: uuid('user_id').references(() => users.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Time tracking tables
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id),
  projectId: uuid('project_id').references(() => projects.id),
  userId: uuid('user_id').references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration').default(0), // in seconds
  description: text('description'),
  isRunning: boolean('is_running').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoice tables
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  projectId: uuid('project_id').references(() => projects.id),
  clientId: uuid('client_id').references(() => users.id),
  status: varchar('status').default('draft'), // draft, sent, paid, overdue
  issueDate: timestamp('issue_date').defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 10, scale: 2 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Project templates
export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  estimatedDuration: integer('estimated_duration'), // in days
  estimatedBudget: decimal('estimated_budget', { precision: 10, scale: 2 }),
  isPublic: boolean('is_public').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const templateTasks = pgTable('template_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => projectTemplates.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  estimatedHours: integer('estimated_hours'),
  phase: varchar('phase', { length: 100 }),
  priority: varchar('priority').default('medium'),
  orderIndex: integer('order_index').default(0),
  dependencies: jsonb('dependencies'), // Array of task IDs
  createdAt: timestamp('created_at').defaultNow(),
});

export const templateMilestones = pgTable('template_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => projectTemplates.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  daysFromStart: integer('days_from_start').notNull(),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Client portal access
export const clientPortalAccess = pgTable('client_portal_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id),
  accessLevel: varchar('access_level').default('view'), // view, comment, upload
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  documents: many(documents),
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'recipient' }),
  notifications: many(notifications),
  activities: many(activities),
  projectMemberships: many(projectMembers),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
  documents: many(documents),
  members: many(projectMembers),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: 'recipient',
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;

// New type exports
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = typeof projectTemplates.$inferInsert;
export type TemplateTask = typeof templateTasks.$inferSelect;
export type InsertTemplateTask = typeof templateTasks.$inferInsert;
export type TemplateMilestone = typeof templateMilestones.$inferSelect;
export type InsertTemplateMilestone = typeof templateMilestones.$inferInsert;
export type ClientPortalAccess = typeof clientPortalAccess.$inferSelect;
export type InsertClientPortalAccess = typeof clientPortalAccess.$inferInsert;
