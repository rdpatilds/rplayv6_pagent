/**
 * Email Service
 * Business logic for email operations
 */

import nodemailer from 'nodemailer';
import type { UserData } from "@shared/types/api.types";

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter(): void {
    try {
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
        console.warn('Email configuration not set. Email features will not work.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn('Email transporter not initialized');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@simulator.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: UserData): Promise<boolean> {
    try {
      const html = this.generateWelcomeEmailHtml(user);

      return await this.sendEmail({
        to: user.email,
        subject: 'Welcome to Financial Advisor Simulator',
        html,
        text: `Welcome ${user.name}! Thank you for joining Financial Advisor Simulator.`,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      const html = this.generatePasswordResetEmailHtml(resetUrl);

      return await this.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html,
        text: `Reset your password: ${resetUrl}`,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send simulation completion email
   */
  async sendSimulationCompletionEmail(
    user: UserData,
    simulationData: {
      industry: string;
      score: number;
      completedAt: Date;
    }
  ): Promise<boolean> {
    try {
      const html = this.generateSimulationCompletionEmailHtml(user, simulationData);

      return await this.sendEmail({
        to: user.email,
        subject: 'Simulation Completed',
        html,
        text: `Congratulations ${user.name}! You completed the ${simulationData.industry} simulation with a score of ${simulationData.score}.`,
      });
    } catch (error) {
      console.error('Error sending simulation completion email:', error);
      throw error;
    }
  }

  /**
   * Send feedback notification email
   */
  async sendFeedbackNotificationEmail(
    user: UserData,
    feedbackSummary: string
  ): Promise<boolean> {
    try {
      const html = this.generateFeedbackNotificationEmailHtml(user, feedbackSummary);

      return await this.sendEmail({
        to: user.email,
        subject: 'New Feedback Available',
        html,
        text: `Hi ${user.name}, you have new feedback available for review.`,
      });
    } catch (error) {
      console.error('Error sending feedback notification email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<number> {
    try {
      let successCount = 0;

      for (const recipient of recipients) {
        try {
          await this.sendEmail({
            ...options,
            to: recipient,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
        }
      }

      return successCount;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHtml(user: UserData): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Welcome to Financial Advisor Simulator!</h1>
          <p>Hi ${user.name},</p>
          <p>Thank you for joining our platform. We're excited to help you develop your financial advisory skills through realistic simulations.</p>
          <p>Get started by exploring your dashboard and starting your first simulation.</p>
          <p>Best regards,<br>The Simulator Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate password reset email HTML
   */
  private generatePasswordResetEmailHtml(resetUrl: string): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password.</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetUrl}" style="color: #007bff;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The Simulator Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate simulation completion email HTML
   */
  private generateSimulationCompletionEmailHtml(
    user: UserData,
    simulationData: {
      industry: string;
      score: number;
      completedAt: Date;
    }
  ): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Simulation Completed!</h1>
          <p>Hi ${user.name},</p>
          <p>Congratulations on completing the ${simulationData.industry} simulation!</p>
          <p><strong>Your Score: ${simulationData.score}/100</strong></p>
          <p>Completed on: ${simulationData.completedAt.toLocaleDateString()}</p>
          <p>View your detailed feedback and performance analysis in your dashboard.</p>
          <p>Best regards,<br>The Simulator Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate feedback notification email HTML
   */
  private generateFeedbackNotificationEmailHtml(
    user: UserData,
    feedbackSummary: string
  ): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>New Feedback Available</h1>
          <p>Hi ${user.name},</p>
          <p>You have new feedback available for review.</p>
          <p>${feedbackSummary}</p>
          <p>Log in to your dashboard to view the complete feedback.</p>
          <p>Best regards,<br>The Simulator Team</p>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
