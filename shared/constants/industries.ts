/**
 * Industries Constants
 */

export const INDUSTRIES = [
  'wealth-management',
  'banking',
  'insurance',
  'financial-planning',
] as const;

export type Industry = typeof INDUSTRIES[number];

export const INDUSTRY_LABELS = {
  'wealth-management': 'Wealth Management',
  'banking': 'Banking',
  'insurance': 'Insurance',
  'financial-planning': 'Financial Planning',
} as const;

export const INDUSTRY_DESCRIPTIONS = {
  'wealth-management': 'Investment and portfolio management for high-net-worth clients',
  'banking': 'Retail and commercial banking services',
  'insurance': 'Life, health, and property insurance products',
  'financial-planning': 'Comprehensive financial planning and advisory services',
} as const;
