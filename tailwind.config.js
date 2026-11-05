/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f8',
          500: '#2563eb',
          600: '#1d4ed8', // Deep Royal Blue Primary
          700: '#1e40af', // Hover state
          800: '#1e3a8a', // Active state
          900: '#172554',
          950: '#0a122c',
        },
        navy: {
          700: '#1e2f52',
          750: '#182644',
          800: '#131f37', // Midnight Navy Card
          850: '#0f172a',
          900: '#0b1120',
          950: '#070b14', // Deepest Canvas
        },
        champagne: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // Champagne Gold Accent for PRO
          700: '#b45309',
        },
        platinum: {
          50: '#ffffff',
          100: '#fafbfd',
          200: '#f4f6f9', // Soft Platinum Off-White
          300: '#e8edf3',
          400: '#cbd5e1',
          500: '#94a3b8',
        },
        sidebar: {
          bg: '#0a0f1d',
          card: '#131f37',
          hover: '#182644',
          active: '#1d4ed8',
          text: '#94a3b8',
          textActive: '#ffffff',
          border: '#1e2f52',
        },
        'dark-bg': '#0a0f1d',
        'dark-card': '#131f37',
        'dark-border': '#1e2f52',
        'dark-hover': '#182644',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        soft: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(15, 23, 42, 0.09), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        hover: '0 12px 24px -6px rgba(15, 23, 42, 0.09), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
