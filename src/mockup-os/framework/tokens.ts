/**
 * Design tokens shared by mockup-side code.
 *
 * The framework/shell uses its own palette (see tailwind.config). These
 * tokens belong to the product being mocked — keep them in one place so
 * multiple screens can't drift apart.
 */

import type { DesignTokens } from './types';

export const tokens: DesignTokens = {
  color: {
    bg: '#fafafa',
    surface: '#ffffff',
    surfaceMuted: '#f4f4f5',
    border: '#e4e4e7',
    text: '#18181b',
    textMuted: '#71717a',
    accent: '#4f46e5',
    accentMuted: '#eef2ff',
    success: '#16a34a',
    warn: '#d97706',
    danger: '#dc2626',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    pill: '9999px',
  },
  font: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
};
