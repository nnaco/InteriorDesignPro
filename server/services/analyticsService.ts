import { db } from '../db';
import { projects, tasks, users, documents, messages } from '@shared/schema';
import { sql, eq, gte, lte, and, count, avg } from 'drizzle-orm';

interface AnalyticsData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    totalUsers: number;
    totalDocuments: number;
    totalMessages: number;
  };
  projectMetrics: {
    projectsByStatus: Array<{ status: string; count: number }>;
    projectsCompletionRate: number;
    averageProjectDuration: number;
  };
  taskMetrics: {
    tasksByStatus: Array<{ status: string; count: number }>;
    tasksByPriority: Array<{ priority: string; count: number }>;
    taskCompletionRate: number;
    overdueTasks: number;
    averageTaskCompletionTime: number;
  };
  userMetrics: {
    usersByRole: Array<{ role: string; count: number }>;
    mostActiveUsers: Array<{ userId: string; email: string; taskCount: number }>;
    userProductivity: Array<{ userId: string; email: string; completedTasks: number }>;
  };
  timeSeriesData: {
    projectsCreatedOverTime: Array<{ date: string; count: number }>;
    tasksCompletedOverTime: Array<{ date: string; count: number }>;
    documentsUploadedOverTime: Array<{ date: string; count: number }>;
  };
}

class AnalyticsService {
  async getComprehensiveAnalytics(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<AnalyticsData> {
    const whereClause = this.buildDateFilter(startDate, endDate);
    const userFilter = userId ? eq(tasks.assigneeId, userId) : undefined;

    const [
      overview,
      projectMetrics,
      taskMetrics,
      userMetrics,
      timeSeriesData
    ] = await Promise.all([
      this.getOverviewMetrics(whereClause),
      this.getProjectMetrics(whereClause),
      this.getTaskMetrics(whereClause, userFilter),
      this.getUserMetrics(),
      this.getTimeSeriesData(startDate, endDate)
    ]);

    return {
      overview,
      projectMetrics,
      taskMetrics,
      userMetrics,
      timeSeriesData
    };
  }

  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return undefined;
    if (startDate && !endDate) return gte(projects.createdAt, startDate);
    if (!startDate && endDate) return lte(projects.createdAt, endDate);
    return and(gte(projects.createdAt, startDate), lte(projects.createdAt, endDate));
  }

  private async getOverviewMetrics(whereClause?: any) {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      totalUsers,
      totalDocuments,
      totalMessages
    ] = await Promise.all([
      db.select({ count: count() }).from(projects).where(whereClause),
      db.select({ count: count() }).from(projects).where(
        and(eq(projects.status, 'active'), whereClause)
      ),
      db.select({ count: count() }).from(projects).where(
        and(eq(projects.status, 'completed'), whereClause)
      ),
      db.select({ count: count() }).from(tasks),
      db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'done')),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(documents),
      db.select({ count: count() }).from(messages)
    ]);

    return {
      totalProjects: totalProjects[0]?.count || 0,
      activeProjects: activeProjects[0]?.count || 0,
      completedProjects: completedProjects[0]?.count || 0,
      totalTasks: totalTasks[0]?.count || 0,
      completedTasks: completedTasks[0]?.count || 0,
      totalUsers: totalUsers[0]?.count || 0,
      totalDocuments: totalDocuments[0]?.count || 0,
      totalMessages: totalMessages[0]?.count || 0,
    };
  }

  private async getProjectMetrics(whereClause?: any) {
    const projectsByStatus = await db
      .select({
        status: projects.status,
        count: count()
      })
      .from(projects)
      .where(whereClause)
      .groupBy(projects.status);

    const completionRate = await this.calculateProjectCompletionRate();
    const averageDuration = await this.calculateAverageProjectDuration();

    return {
      projectsByStatus: projectsByStatus.map(item => ({
        status: item.status,
        count: item.count
      })),
      projectsCompletionRate: completionRate,
      averageProjectDuration: averageDuration
    };
  }

  private async getTaskMetrics(whereClause?: any, userFilter?: any) {
    const taskFilter = userFilter ? and(whereClause, userFilter) : whereClause;

    const [tasksByStatus, tasksByPriority, overdueTasks] = await Promise.all([
      db.select({
        status: tasks.status,
        count: count()
      }).from(tasks).where(taskFilter).groupBy(tasks.status),

      db.select({
        priority: tasks.priority,
        count: count()
      }).from(tasks).where(taskFilter).groupBy(tasks.priority),

      db.select({ count: count() }).from(tasks).where(
        and(taskFilter, lte(tasks.dueDate, new Date()))
      )
    ]);

    const completionRate = await this.calculateTaskCompletionRate(taskFilter);
    const averageCompletionTime = await this.calculateAverageTaskCompletionTime();

    return {
      tasksByStatus: tasksByStatus.map(item => ({
        status: item.status,
        count: item.count
      })),
      tasksByPriority: tasksByPriority.map(item => ({
        priority: item.priority || 'none',
        count: item.count
      })),
      taskCompletionRate: completionRate,
      overdueTasks: overdueTasks[0]?.count || 0,
      averageTaskCompletionTime: averageCompletionTime
    };
  }

  private async getUserMetrics() {
    const [usersByRole, mostActiveUsers, userProductivity] = await Promise.all([
      db.select({
        role: users.role,
        count: count()
      }).from(users).groupBy(users.role),

      db.select({
        userId: tasks.assigneeId,
        email: users.email,
        taskCount: count()
      }).from(tasks)
        .innerJoin(users, eq(tasks.assigneeId, users.id))
        .groupBy(tasks.assigneeId, users.email)
        .orderBy(sql`count(*) DESC`)
        .limit(10),

      db.select({
        userId: tasks.assigneeId,
        email: users.email,
        completedTasks: count()
      }).from(tasks)
        .innerJoin(users, eq(tasks.assigneeId, users.id))
        .where(eq(tasks.status, 'done'))
        .groupBy(tasks.assigneeId, users.email)
        .orderBy(sql`count(*) DESC`)
        .limit(10)
    ]);

    return {
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item.count
      })),
      mostActiveUsers: mostActiveUsers.map(item => ({
        userId: item.userId || '',
        email: item.email || '',
        taskCount: item.taskCount
      })),
      userProductivity: userProductivity.map(item => ({
        userId: item.userId || '',
        email: item.email || '',
        completedTasks: item.completedTasks
      }))
    };
  }

  private async getTimeSeriesData(startDate?: Date, endDate?: Date) {
    const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const defaultEndDate = endDate || new Date();

    const [projectsOverTime, tasksOverTime, documentsOverTime] = await Promise.all([
      this.getTimeSeriesCount(projects.createdAt, defaultStartDate, defaultEndDate, projects),
      this.getTimeSeriesCount(tasks.createdAt, defaultStartDate, defaultEndDate, tasks, eq(tasks.status, 'done')),
      this.getTimeSeriesCount(documents.createdAt, defaultStartDate, defaultEndDate, documents)
    ]);

    return {
      projectsCreatedOverTime: projectsOverTime,
      tasksCompletedOverTime: tasksOverTime,
      documentsUploadedOverTime: documentsOverTime
    };
  }

  private async getTimeSeriesCount(
    dateColumn: any,
    startDate: Date,
    endDate: Date,
    table: any,
    additionalFilter?: any
  ): Promise<Array<{ date: string; count: number }>> {
    const whereCondition = additionalFilter
      ? and(gte(dateColumn, startDate), lte(dateColumn, endDate), additionalFilter)
      : and(gte(dateColumn, startDate), lte(dateColumn, endDate));

    const results = await db
      .select({
        date: sql<string>`DATE(${dateColumn})`,
        count: count()
      })
      .from(table)
      .where(whereCondition)
      .groupBy(sql`DATE(${dateColumn})`)
      .orderBy(sql`DATE(${dateColumn})`);

    return results.map(item => ({
      date: item.date,
      count: item.count
    }));
  }

  private async calculateProjectCompletionRate(): Promise<number> {
    const [total, completed] = await Promise.all([
      db.select({ count: count() }).from(projects),
      db.select({ count: count() }).from(projects).where(eq(projects.status, 'completed'))
    ]);

    const totalCount = total[0]?.count || 0;
    const completedCount = completed[0]?.count || 0;

    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  }

  private async calculateTaskCompletionRate(filter?: any): Promise<number> {
    const [total, completed] = await Promise.all([
      db.select({ count: count() }).from(tasks).where(filter),
      db.select({ count: count() }).from(tasks).where(and(eq(tasks.status, 'done'), filter))
    ]);

    const totalCount = total[0]?.count || 0;
    const completedCount = completed[0]?.count || 0;

    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  }

  private async calculateAverageProjectDuration(): Promise<number> {
    const completedProjects = await db
      .select({
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt
      })
      .from(projects)
      .where(eq(projects.status, 'completed'));

    if (completedProjects.length === 0) return 0;

    const totalDuration = completedProjects.reduce((sum, project) => {
      const duration = project.updatedAt && project.createdAt
        ? new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime()
        : 0;
      return sum + duration;
    }, 0);

    return Math.round(totalDuration / completedProjects.length / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private async calculateAverageTaskCompletionTime(): Promise<number> {
    const completedTasks = await db
      .select({
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt
      })
      .from(tasks)
      .where(eq(tasks.status, 'done'));

    if (completedTasks.length === 0) return 0;

    const totalDuration = completedTasks.reduce((sum, task) => {
      const duration = task.updatedAt && task.createdAt
        ? new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()
        : 0;
      return sum + duration;
    }, 0);

    return Math.round(totalDuration / completedTasks.length / (1000 * 60 * 60 * 24)); // Convert to days
  }
}

export const analyticsService = new AnalyticsService();