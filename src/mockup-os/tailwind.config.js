/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './app/**/*.{ts,tsx}',
    './framework/**/*.{ts,tsx}',
    './mockups/**/*.{ts,tsx}',
    './shell/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Framework / shell chrome palette. Intentionally neutral so it
        // does not clash visually with mockup content.
        shell: {
          bg: '#0b0d10',
          panel: '#14171c',
          border: '#24282f',
          muted: '#6b7280',
          text: '#e5e7eb',
          accent: '#6366f1',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
