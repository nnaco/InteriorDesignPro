import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  REPLIT_DOMAINS: z.string().optional(),
  REPL_ID: z.string().optional(),
  ISSUER_URL: z.string().default('https://replit.com/oidc'),
  
  // Email configuration
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().default('noreply@designflow.app'),
  
  // App configuration
  APP_URL: z.string().url().default('https://designflow.app'),
  MAX_FILE_SIZE: z.string().default('50MB'),
  MAX_FILES_PER_PROJECT: z.string().default('100'),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('12'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('1000'),
  
  // File storage
  UPLOAD_DIR: z.string().default('./uploads'),
  TEMP_DIR: z.string().default('./temp'),
  
  // Analytics
  ANALYTICS_RETENTION_DAYS: z.string().default('365'),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_REQUEST_LOGGING: z.string().default('true'),
});

type Environment = z.infer<typeof envSchema>;

class Config {
  private static instance: Config;
  private _env: Environment;

  private constructor() {
    try {
      this._env = envSchema.parse(process.env);
    } catch (error) {
      console.error('Environment validation failed:', error);
      process.exit(1);
    }
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  get env(): Environment {
    return this._env;
  }

  get isDevelopment(): boolean {
    return this._env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this._env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this._env.NODE_ENV === 'test';
  }

  // Database configuration
  get database() {
    return {
      url: this._env.DATABASE_URL,
      ssl: this.isProduction,
      poolSize: this.isProduction ? 20 : 5,
    };
  }

  // Server configuration
  get server() {
    return {
      port: parseInt(this._env.PORT),
      host: '0.0.0.0',
    };
  }

  // Session configuration
  get session() {
    return {
      secret: this._env.SESSION_SECRET,
      maxAge: this.isProduction ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days in prod, 1 day in dev
      secure: this.isProduction,
      httpOnly: true,
      sameSite: this.isProduction ? 'strict' as const : 'lax' as const,
    };
  }

  // File upload configuration
  get fileUpload() {
    return {
      maxSize: this.parseSize(this._env.MAX_FILE_SIZE),
      maxFilesPerProject: parseInt(this._env.MAX_FILES_PER_PROJECT),
      uploadDir: this._env.UPLOAD_DIR,
      tempDir: this._env.TEMP_DIR,
      allowedMimeTypes: [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf', 'text/plain', 'text/csv',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // CAD files
        'application/acad', 'image/vnd.dwg', 'application/dxf',
        // 3D files
        'model/obj', 'model/stl', 'application/sla',
        // Archives
        'application/zip', 'application/x-rar-compressed',
      ],
    };
  }

  // Rate limiting configuration
  get rateLimit() {
    return {
      windowMs: parseInt(this._env.RATE_LIMIT_WINDOW_MS),
      maxRequests: parseInt(this._env.RATE_LIMIT_MAX_REQUESTS),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    };
  }

  // Email configuration
  get email() {
    return {
      apiKey: this._env.SENDGRID_API_KEY,
      fromEmail: this._env.FROM_EMAIL,
      enabled: !!this._env.SENDGRID_API_KEY,
    };
  }

  // Security configuration
  get security() {
    return {
      bcryptRounds: parseInt(this._env.BCRYPT_ROUNDS),
      jwtExpiresIn: this._env.JWT_EXPIRES_IN,
      corsOrigins: this.getCorsOrigins(),
      trustProxy: this.isProduction,
    };
  }

  // Monitoring configuration
  get monitoring() {
    return {
      logLevel: this._env.LOG_LEVEL,
      requestLogging: this._env.ENABLE_REQUEST_LOGGING === 'true',
      metricsEnabled: this.isProduction,
    };
  }

  // Analytics configuration
  get analytics() {
    return {
      retentionDays: parseInt(this._env.ANALYTICS_RETENTION_DAYS),
      enabled: true,
    };
  }

  private parseSize(sizeStr: string): number {
    const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
    if (!match) throw new Error(`Invalid size format: ${sizeStr}`);
    
    const [, size, unit] = match;
    return parseInt(size) * units[unit.toUpperCase() as keyof typeof units];
  }

  private getCorsOrigins(): string[] {
    const origins = [
      'http://localhost:3000',
      'http://localhost:5173',
      this._env.APP_URL,
    ];

    if (this._env.REPLIT_DOMAINS) {
      const replitDomains = this._env.REPLIT_DOMAINS.split(',').map(domain => `https://${domain.trim()}`);
      origins.push(...replitDomains);
    }

    return origins.filter(Boolean);
  }

  // Validation helpers
  validateRequired(key: keyof Environment): void {
    if (!this._env[key]) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
  }

  // Development helpers
  logConfiguration(): void {
    if (this.isDevelopment) {
      console.log('Configuration loaded:');
      console.log(`- Environment: ${this._env.NODE_ENV}`);
      console.log(`- Port: ${this.server.port}`);
      console.log(`- Database: ${this._env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      console.log(`- Email: ${this.email.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`- Max file size: ${this._env.MAX_FILE_SIZE}`);
      console.log(`- Log level: ${this.monitoring.logLevel}`);
    }
  }
}

export const config = Config.getInstance();
export type { Environment };