import { storage } from '../storage';
import { emailService } from './emailService';
import type { User } from '@shared/schema';

interface NotificationData {
  userId: string;
  type: 'project_assigned' | 'task_assigned' | 'task_due' | 'project_status_change' | 'task_completed';
  title: string;
  message: string;
  metadata?: any;
  sendEmail?: boolean;
}

class NotificationService {
  async createNotification(data: NotificationData): Promise<void> {
    try {
      // Create in-app notification
      await storage.createNotification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        isRead: false,
      });

      // Send email notification if enabled
      if (data.sendEmail !== false) {
        const user = await storage.getUser(data.userId);
        if (user?.email) {
          await this.sendEmailNotification(user, data);
        }
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  private async sendEmailNotification(user: User, data: NotificationData): Promise<void> {
    try {
      switch (data.type) {
        case 'project_assigned':
          await emailService.sendProjectAssignmentNotification(
            user.email!,
            user.firstName || user.email!,
            data.metadata.projectName,
            data.metadata.projectId
          );
          break;

        case 'task_assigned':
          await emailService.sendTaskAssignmentNotification(
            user.email!,
            user.firstName || user.email!,
            data.metadata.taskTitle,
            data.metadata.projectName,
            data.metadata.dueDate ? new Date(data.metadata.dueDate) : undefined
          );
          break;

        case 'task_due':
          await emailService.sendTaskReminderNotification(
            user.email!,
            user.firstName || user.email!,
            data.metadata.taskTitle,
            new Date(data.metadata.dueDate),
            data.metadata.isOverdue
          );
          break;

        case 'project_status_change':
          await emailService.sendProjectStatusUpdateNotification(
            user.email!,
            user.firstName || user.email!,
            data.metadata.projectName,
            data.metadata.oldStatus,
            data.metadata.newStatus,
            data.metadata.projectId
          );
          break;

        default:
          // Generic email notification
          await emailService.sendEmail({
            to: user.email!,
            from: 'noreply@designflow.app',
            subject: data.title,
            text: data.message,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">${data.title}</h2>
                <p>${data.message}</p>
                <p>Best regards,<br>DesignFlow Team</p>
              </div>
            `
          });
          break;
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  async notifyProjectAssignment(userId: string, projectId: string, projectName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'project_assigned',
      title: 'New Project Assignment',
      message: `You have been assigned to project: ${projectName}`,
      metadata: { projectId, projectName },
      sendEmail: true
    });
  }

  async notifyTaskAssignment(
    userId: string, 
    taskTitle: string, 
    projectName: string, 
    dueDate?: Date
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'task_assigned',
      title: 'New Task Assignment',
      message: `You have been assigned a new task: ${taskTitle}`,
      metadata: { taskTitle, projectName, dueDate },
      sendEmail: true
    });
  }

  async notifyTaskDue(userId: string, taskTitle: string, dueDate: Date, isOverdue = false): Promise<void> {
    const title = isOverdue ? 'Task Overdue' : 'Task Due Soon';
    const message = isOverdue 
      ? `Task "${taskTitle}" is overdue (due: ${dueDate.toLocaleDateString()})`
      : `Task "${taskTitle}" is due soon (${dueDate.toLocaleDateString()})`;

    await this.createNotification({
      userId,
      type: 'task_due',
      title,
      message,
      metadata: { taskTitle, dueDate, isOverdue },
      sendEmail: true
    });
  }

  async notifyProjectStatusChange(
    userIds: string[], 
    projectId: string, 
    projectName: string, 
    oldStatus: string, 
    newStatus: string
  ): Promise<void> {
    const notifications = userIds.map(userId => 
      this.createNotification({
        userId,
        type: 'project_status_change',
        title: 'Project Status Updated',
        message: `Project "${projectName}" status changed from ${oldStatus} to ${newStatus}`,
        metadata: { projectId, projectName, oldStatus, newStatus },
        sendEmail: true
      })
    );

    await Promise.all(notifications);
  }

  async notifyTaskCompletion(userId: string, taskTitle: string, projectName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'task_completed',
      title: 'Task Completed',
      message: `Task "${taskTitle}" has been completed in project ${projectName}`,
      metadata: { taskTitle, projectName },
      sendEmail: false // Don't spam with completion emails
    });
  }

  // Bulk notifications for team updates
  async notifyTeamMembers(
    userIds: string[],
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    const notifications = userIds.map(userId =>
      this.createNotification({
        userId,
        type: 'project_assigned', // Generic type
        title,
        message,
        metadata,
        sendEmail: false
      })
    );

    await Promise.all(notifications);
  }

  // Scheduled task reminders (to be called by a cron job)
  async sendDueTaskReminders(): Promise<void> {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get tasks due tomorrow
      const dueTasks = await storage.getTasksDueBetween(today, tomorrow);
      
      for (const task of dueTasks) {
        if (task.assigneeId && task.dueDate) {
          await this.notifyTaskDue(
            task.assigneeId, 
            task.title, 
            new Date(task.dueDate)
          );
        }
      }

      // Get overdue tasks
      const overdueTasks = await storage.getOverdueTasks();
      
      for (const task of overdueTasks) {
        if (task.assigneeId && task.dueDate) {
          await this.notifyTaskDue(
            task.assigneeId, 
            task.title, 
            new Date(task.dueDate),
            true
          );
        }
      }
    } catch (error) {
      console.error('Failed to send due task reminders:', error);
    }
  }
}

export const notificationService = new NotificationService();