import type { Config } from 'tailwindcss'

/**
 * Theme is driven by CSS variables declared in src/styles/tokens.css.
 * Tailwind utilities map onto those vars so a single token edit re-skins
 * the whole app (and enables future theming per tenant brand).
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          fg: 'rgb(var(--brand-fg) / <alpha-value>)',
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
        },
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          subtle: 'rgb(var(--text-subtle) / <alpha-value>)',
          inverse: 'rgb(var(--text-inverse) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          hover: 'rgb(var(--surface-hover) / <alpha-value>)',
        },
        // Colour-blind-safe status palette. Always paired with icon + text label.
        status: {
          active: 'rgb(var(--status-active) / <alpha-value>)',
          'active-bg': 'rgb(var(--status-active-bg) / <alpha-value>)',
          warn: 'rgb(var(--status-warn) / <alpha-value>)',
          'warn-bg': 'rgb(var(--status-warn-bg) / <alpha-value>)',
          expired: 'rgb(var(--status-expired) / <alpha-value>)',
          'expired-bg': 'rgb(var(--status-expired-bg) / <alpha-value>)',
          info: 'rgb(var(--status-info) / <alpha-value>)',
          'info-bg': 'rgb(var(--status-info-bg) / <alpha-value>)',
          neutral: 'rgb(var(--status-neutral) / <alpha-value>)',
          'neutral-bg': 'rgb(var(--status-neutral-bg) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      ringColor: {
        focus: 'rgb(var(--focus) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

export default config
