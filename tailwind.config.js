/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-light) / 0.9)',
          100: 'rgb(var(--color-primary-light) / 0.8)',
          200: 'rgb(var(--color-primary-light) / 0.7)',
          300: 'rgb(var(--color-primary-light) / 0.6)',
          400: 'rgb(var(--color-primary-light) / 0.5)',
          500: 'var(--color-primary-teal)',
          600: 'var(--color-primary-teal)',
          700: 'color-mix(in srgb, var(--color-primary-teal), black 10%)',
          800: 'color-mix(in srgb, var(--color-primary-teal), black 20%)',
          900: 'color-mix(in srgb, var(--color-primary-teal), black 30%)',
        },
        accent: {
          50: 'rgb(var(--color-secondary-gold) / 0.1)',
          100: 'rgb(var(--color-secondary-gold) / 0.2)',
          200: 'rgb(var(--color-secondary-gold) / 0.3)',
          300: 'rgb(var(--color-secondary-gold) / 0.4)',
          400: 'rgb(var(--color-secondary-gold) / 0.5)',
          500: 'var(--color-secondary-gold)',
          600: 'color-mix(in srgb, var(--color-secondary-gold), black 10%)',
          700: 'color-mix(in srgb, var(--color-secondary-gold), black 20%)',
          800: 'color-mix(in srgb, var(--color-secondary-gold), black 30%)',
          900: 'var(--color-secondary-gold)',
        },
        // Background and surface colors
        background: {
          DEFAULT: 'var(--color-background-default)',
          surface: 'var(--color-background-surface)',
        },
        // Text colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        // Functional colors
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        sky: 'var(--color-accent-sky)',
        divider: 'var(--color-divider-gray)',
        taupe: 'var(--color-neutral-taupe)',
      },
      boxShadow: {
        'card': '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 8px -1px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
        'card-elevated': '0 8px 16px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.08)',
        'card-floating': '0 12px 24px -6px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        // Override Tailwind defaults to match ImagineAI
        'xs': ['12px', { lineHeight: '18px' }],
        'sm': ['14px', { lineHeight: '21px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '27px' }],
        'xl': ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '28.8px', fontWeight: '400' }],
        '3xl': ['36px', { lineHeight: '54px', fontWeight: '400' }],
        '4xl': ['40px', { lineHeight: '44px', fontWeight: '400', letterSpacing: '-1.2px' }],
        '5xl': ['48px', { lineHeight: '52.8px', fontWeight: '400', letterSpacing: '-1.44px' }],
        '6xl': ['64px', { lineHeight: '70.4px', fontWeight: '400', letterSpacing: '-1.92px' }],
        '7xl': ['64px', { lineHeight: '70.4px', fontWeight: '400', letterSpacing: '-1.92px' }],
        '8xl': ['64px', { lineHeight: '70.4px', fontWeight: '400', letterSpacing: '-1.92px' }],
        '9xl': ['64px', { lineHeight: '70.4px', fontWeight: '400', letterSpacing: '-1.92px' }],
        // ImagineAI typography scale (aliases)
        'imagine-h1': ['64px', { lineHeight: '70.4px', letterSpacing: '-1.92px', fontWeight: '400' }],
        'imagine-h2': ['36px', { lineHeight: '54px', fontWeight: '400' }],
        'imagine-h3': ['24px', { lineHeight: '28.8px', fontWeight: '400' }],
        'imagine-h4': ['20px', { lineHeight: '30px', fontWeight: '400' }],
        'imagine-body': ['20px', { lineHeight: '30px' }],
        'imagine-base': ['16px', { lineHeight: '24px' }],
        // Responsive variants
        'imagine-h1-mobile': ['40px', { lineHeight: '44px', letterSpacing: '-1.2px', fontWeight: '400' }],
        'imagine-h2-mobile': ['28px', { lineHeight: '42px', fontWeight: '400' }],
        'imagine-h3-mobile': ['20px', { lineHeight: '24px', fontWeight: '400' }],
        'imagine-body-mobile': ['18px', { lineHeight: '27px' }],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '500',
        'bold': '600',
      },
    },
  },
  plugins: [],
};