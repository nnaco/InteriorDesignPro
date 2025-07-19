import { MailService } from '@sendgrid/mail';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private mailService: MailService;
  private isConfigured: boolean;

  constructor() {
    this.mailService = new MailService();
    this.isConfigured = false;
    
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Email service not configured - SENDGRID_API_KEY missing');
      return false;
    }

    try {
      await this.mailService.send({
        to: params.to,
        from: params.from || process.env.FROM_EMAIL || 'noreply@designflow.app',
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Project notification templates
  async sendProjectAssignmentNotification(
    userEmail: string,
    userName: string,
    projectName: string,
    projectId: string
  ): Promise<boolean> {
    const subject = `You've been assigned to project: ${projectName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Project Assignment - DesignFlow</h2>
        <p>Hi ${userName},</p>
        <p>You have been assigned to a new project: <strong>${projectName}</strong></p>
        <p>You can view the project details and get started by logging into DesignFlow.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://designflow.app'}/projects/${projectId}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Project
          </a>
        </div>
        <p>Best regards,<br>DesignFlow Team</p>
      </div>
    `;
    const text = `Hi ${userName}, you have been assigned to project: ${projectName}. View it at: ${process.env.APP_URL}/projects/${projectId}`;

    return this.sendEmail({ to: userEmail, subject, html, text, from: 'noreply@designflow.app' });
  }

  async sendTaskAssignmentNotification(
    userEmail: string,
    userName: string,
    taskTitle: string,
    projectName: string,
    dueDate?: Date
  ): Promise<boolean> {
    const subject = `New task assigned: ${taskTitle}`;
    const dueDateText = dueDate ? ` Due: ${dueDate.toLocaleDateString()}` : '';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Task Assignment - DesignFlow</h2>
        <p>Hi ${userName},</p>
        <p>A new task has been assigned to you:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 10px 0;">${taskTitle}</h3>
          <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
          ${dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>` : ''}
        </div>
        <p>Please log into DesignFlow to view the task details and get started.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://designflow.app'}/tasks" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Tasks
          </a>
        </div>
        <p>Best regards,<br>DesignFlow Team</p>
      </div>
    `;
    const text = `Hi ${userName}, new task assigned: ${taskTitle} in project ${projectName}.${dueDateText}`;

    return this.sendEmail({ to: userEmail, subject, html, text, from: 'noreply@designflow.app' });
  }

  async sendTaskReminderNotification(
    userEmail: string,
    userName: string,
    taskTitle: string,
    dueDate: Date,
    isOverdue: boolean = false
  ): Promise<boolean> {
    const subject = isOverdue 
      ? `Overdue Task: ${taskTitle}` 
      : `Task Due Reminder: ${taskTitle}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isOverdue ? '#dc2626' : '#f59e0b'};">
          ${isOverdue ? 'Overdue Task' : 'Task Due Reminder'} - DesignFlow
        </h2>
        <p>Hi ${userName},</p>
        <p>This is a reminder about your task:</p>
        <div style="background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 10px 0;">${taskTitle}</h3>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
          ${isOverdue ? '<p style="color: #dc2626; font-weight: bold;">This task is overdue!</p>' : ''}
        </div>
        <p>Please log into DesignFlow to update the task status.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://designflow.app'}/tasks" 
             style="background: ${isOverdue ? '#dc2626' : '#f59e0b'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Tasks
          </a>
        </div>
        <p>Best regards,<br>DesignFlow Team</p>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html, from: 'noreply@designflow.app' });
  }

  async sendProjectStatusUpdateNotification(
    userEmail: string,
    userName: string,
    projectName: string,
    oldStatus: string,
    newStatus: string,
    projectId: string
  ): Promise<boolean> {
    const subject = `Project Status Update: ${projectName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Project Status Update - DesignFlow</h2>
        <p>Hi ${userName},</p>
        <p>The status of project <strong>${projectName}</strong> has been updated:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>New Status:</strong> ${newStatus}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL || 'https://designflow.app'}/projects/${projectId}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Project
          </a>
        </div>
        <p>Best regards,<br>DesignFlow Team</p>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html, from: 'noreply@designflow.app' });
  }
}

export const emailService = new EmailService();