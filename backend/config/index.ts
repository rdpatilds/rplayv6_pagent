/**
 * Backend Configuration
 * Centralized configuration for backend services
 */

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Authentication
  auth: {
    sessionExpiryDays: 30,
    passwordMinLength: 8,
    requirePasswordComplexity: true,
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4',
    defaultTemperature: 0.7,
    maxTokens: 500,
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@simulator.com',
  },

  // App
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // API
  api: {
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    },
  },

  // Features
  features: {
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableEngagementTracking: process.env.ENABLE_ENGAGEMENT_TRACKING !== 'false', // Default true
    enableAIEvaluation: process.env.ENABLE_AI_EVALUATION !== 'false', // Default true
  },

  // Simulation defaults
  simulation: {
    defaultDifficultyLevel: 3,
    maxConversationLength: 50,
    sessionTimeoutMinutes: 60,
  },
};

/**
 * Validate required environment variables
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration value by path
 */
export function getConfig(path: string): any {
  const parts = path.split('.');
  let value: any = config;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) {
      return null;
    }
  }

  return value;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof config.features): boolean {
  return config.features[feature] === true;
}

/**
 * Get environment name
 */
export function getEnvironment(): string {
  return config.app.environment;
}

/**
 * Check if in production
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Log configuration (with sensitive data masked)
 */
export function logConfig(): void {
  const maskedConfig = {
    ...config,
    database: {
      ...config.database,
      url: config.database.url ? '***' : '',
    },
    openai: {
      ...config.openai,
      apiKey: config.openai.apiKey ? '***' : '',
    },
    email: {
      ...config.email,
      password: config.email.password ? '***' : '',
    },
  };

  console.log('Backend Configuration:', JSON.stringify(maskedConfig, null, 2));
}

export default config;
