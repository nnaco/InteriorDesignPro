import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  responseTime: number;
  statusCode: number;
  error?: string;
}

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  activeConnections: number;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}

class MonitoringService {
  private requestLogs: RequestLog[] = [];
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorCount: 0,
    activeConnections: 0,
    memoryUsage: process.memoryUsage(),
    uptime: 0,
  };
  private responseTimes: number[] = [];
  private readonly maxLogs = 10000;
  private startTime = Date.now();

  constructor() {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Clean old logs every hour
    setInterval(() => {
      this.cleanOldLogs();
    }, 3600000);
  }

  // Request logging middleware
  requestLogger = (req: Request, res: Response, next: NextFunction) => {
    if (!config.monitoring.requestLogging) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;

    // Track active connections
    this.metrics.activeConnections++;

    res.send = function (data) {
      const responseTime = Date.now() - startTime;

      // Create log entry
      const logEntry: RequestLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userId: (req as any).user?.sub,
        responseTime,
        statusCode: res.statusCode,
      };

      // Add error if status code indicates an error
      if (res.statusCode >= 400) {
        logEntry.error = `HTTP ${res.statusCode}`;
      }

      monitoringService.addRequestLog(logEntry);
      return originalSend.call(this, data);
    };

    res.on('finish', () => {
      this.metrics.activeConnections--;
    });

    next();
  };

  private addRequestLog(logEntry: RequestLog): void {
    this.requestLogs.push(logEntry);
    this.responseTimes.push(logEntry.responseTime);

    // Update metrics
    this.metrics.requestCount++;
    if (logEntry.statusCode >= 400) {
      this.metrics.errorCount++;
    }

    // Keep only recent logs
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogs);
    }

    // Keep only recent response times for average calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Log errors and slow requests
    if (config.isDevelopment) {
      if (logEntry.statusCode >= 500) {
        console.error(
          `[ERROR] ${logEntry.method} ${logEntry.url} - ${logEntry.statusCode} (${logEntry.responseTime}ms)`
        );
      } else if (logEntry.responseTime > 2000) {
        console.warn(
          `[SLOW] ${logEntry.method} ${logEntry.url} - ${logEntry.responseTime}ms`
        );
      } else if (config.monitoring.logLevel === 'debug') {
        console.debug(
          `[REQ] ${logEntry.method} ${logEntry.url} - ${logEntry.statusCode} (${logEntry.responseTime}ms)`
        );
      }
    }
  }

  private updateMetrics(): void {
    // Update average response time
    if (this.responseTimes.length > 0) {
      this.metrics.averageResponseTime =
        this.responseTimes.reduce((sum, time) => sum + time, 0) /
        this.responseTimes.length;
    }

    // Update memory usage
    this.metrics.memoryUsage = process.memoryUsage();

    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime;

    // Log metrics in development
    if (config.isDevelopment && config.monitoring.logLevel === 'debug') {
      console.debug('Metrics updated:', {
        requests: this.metrics.requestCount,
        avgResponseTime: Math.round(this.metrics.averageResponseTime),
        errors: this.metrics.errorCount,
        activeConnections: this.metrics.activeConnections,
        memoryMB: Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024),
      });
    }
  }

  private cleanOldLogs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.requestLogs = this.requestLogs.filter(
      (log) => new Date(log.timestamp) > oneDayAgo
    );
  }

  // Public methods for accessing monitoring data
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getRecentLogs(limit = 100): RequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  getErrorLogs(limit = 50): RequestLog[] {
    return this.requestLogs
      .filter((log) => log.statusCode >= 400)
      .slice(-limit);
  }

  getSlowRequests(threshold = 2000, limit = 50): RequestLog[] {
    return this.requestLogs
      .filter((log) => log.responseTime > threshold)
      .slice(-limit);
  }

  getRequestsByEndpoint(): {
    [endpoint: string]: { count: number; avgResponseTime: number };
  } {
    const endpoints: { [key: string]: { times: number[]; count: number } } = {};

    this.requestLogs.forEach((log) => {
      // Normalize URL by removing query params and IDs
      const normalizedUrl = log.url
        .replace(/\?.*$/, '') // Remove query params
        .replace(/\/[a-f0-9-]{36}/g, '/:id') // Replace UUIDs with :id
        .replace(/\/\d+/g, '/:id'); // Replace numeric IDs with :id

      const key = `${log.method} ${normalizedUrl}`;

      if (!endpoints[key]) {
        endpoints[key] = { times: [], count: 0 };
      }

      endpoints[key].times.push(log.responseTime);
      endpoints[key].count++;
    });

    // Calculate averages
    const result: {
      [endpoint: string]: { count: number; avgResponseTime: number };
    } = {};

    Object.entries(endpoints).forEach(([endpoint, data]) => {
      result[endpoint] = {
        count: data.count,
        avgResponseTime:
          data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
      };
    });

    return result;
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    details: {
      uptime: number;
      memoryUsage: number;
      errorRate: number;
      avgResponseTime: number;
      activeConnections: number;
    };
  } {
    const memoryUsagePercent =
      (this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal) *
      100;
    const errorRate =
      this.metrics.requestCount > 0
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100
        : 0;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Determine status based on various metrics
    if (
      memoryUsagePercent > 90 ||
      errorRate > 10 ||
      this.metrics.averageResponseTime > 5000
    ) {
      status = 'critical';
    } else if (
      memoryUsagePercent > 80 ||
      errorRate > 5 ||
      this.metrics.averageResponseTime > 2000
    ) {
      status = 'warning';
    }

    return {
      status,
      details: {
        uptime: this.metrics.uptime,
        memoryUsage: memoryUsagePercent,
        errorRate,
        avgResponseTime: this.metrics.averageResponseTime,
        activeConnections: this.metrics.activeConnections,
      },
    };
  }

  // Error tracking
  logError(error: Error, context?: any): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    };

    console.error('[ERROR]', JSON.stringify(errorLog, null, 2));

    // In production, you would send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
  }

  // Performance tracking
  trackDatabaseQuery(query: string, duration: number): void {
    if (config.monitoring.logLevel === 'debug') {
      console.debug(`[DB] ${query} - ${duration}ms`);
    }

    if (duration > 1000) {
      console.warn(`[SLOW_QUERY] ${query} - ${duration}ms`);
    }
  }

  trackBackgroundJob(
    jobName: string,
    duration: number,
    success: boolean
  ): void {
    const logLevel = success ? 'info' : 'error';
    const message = `[JOB] ${jobName} - ${
      success ? 'SUCCESS' : 'FAILED'
    } (${duration}ms)`;

    if (config.monitoring.logLevel === 'debug' || !success) {
      console[logLevel](message);
    }
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();

// Express middleware
export const requestLogger = monitoringService.requestLogger;

// Health check endpoint helper
export const healthCheck = () => monitoringService.getHealthStatus();
