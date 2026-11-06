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
        // Deep Navy + Teal Accent + Ice White + Frost Blue + Slate Grey + Soft Border
        navy: {
          DEFAULT: '#0E2233',
          50: '#F0F5FA',
          100: '#DCE7F0',
          200: '#B8D1E3',
          300: '#8FB6D3',
          400: '#5F95C0',
          500: '#3A74A4',
          600: '#285882',
          700: '#1D4162',
          800: '#152F48',
          900: '#0E2233', // Deep Navy Primary Brand
          950: '#07131D',
        },
        midnight: {
          DEFAULT: '#0E2233',
          900: '#0E2233',
        },
        teal: {
          DEFAULT: '#00BFA6',
          50: '#F0FDFB',
          100: '#CCFBF5',
          200: '#99F6EC',
          300: '#5EEAD9',
          400: '#2DD4C4',
          500: '#00BFA6', // Teal Accent Primary Action & Highlight
          600: '#00A892', // Hover state
          700: '#008C79', // Active state
          800: '#006E5F',
          900: '#005449',
          950: '#00332D',
        },
        ice: {
          DEFAULT: '#F6FAFC', // Ice White Main Canvas
          50: '#FFFFFF',
          100: '#FBFCFE',
          200: '#F6FAFC',
          300: '#EDF3F7',
          400: '#E1EBF0',
          500: '#D4E2E9',
        },
        frost: {
          DEFAULT: '#E8F1F5', // Frost Blue Secondary Surface
          50: '#F7FAFC',
          100: '#F0F5F8',
          200: '#E8F1F5',
          300: '#D5E5ED',
          400: '#BCD3E0',
          500: '#9EBFD1',
        },
        mist: {
          DEFAULT: '#E8F1F5', // Alias for Frost Blue
          200: '#E8F1F5',
        },
        slate: {
          DEFAULT: '#1F2D3D',
          50: '#F4F6F8',
          100: '#E6EBF0',
          200: '#CCD8E2',
          300: '#A9BECD',
          400: '#7F9CB3',
          500: '#5E7D96',
          600: '#466278',
          700: '#344B5D',
          800: '#273B4B',
          900: '#1F2D3D', // Slate Grey Text & Elements
          950: '#121C26',
        },
        ink: {
          DEFAULT: '#1F2D3D', // Alias for Slate Grey
          900: '#1F2D3D',
        },
        softborder: {
          DEFAULT: '#D8E4EA', // Soft Border
          light: '#EBF1F5',
          dark: '#1F2D3D',
        },
        coolborder: {
          DEFAULT: '#D8E4EA', // Alias for Soft Border
          light: '#EBF1F5',
          dark: '#1F2D3D',
        },
        // Brand is mapped to Teal Accent (#00BFA6) for primary CTAs & active accents
        brand: {
          50: '#F0FDFB',
          100: '#CCFBF5',
          200: '#99F6EC',
          300: '#5EEAD9',
          400: '#2DD4C4',
          500: '#00BFA6', // Teal Accent
          600: '#00A892', // Hover
          700: '#008C79', // Active
          800: '#006E5F',
          900: '#005449',
          950: '#00332D',
        },
        surface: {
          canvas: '#F6FAFC',          // Ice White
          card: '#FFFFFF',            // Pure White
          secondary: '#E8F1F5',       // Frost Blue
          'dark-canvas': '#08141F',   // Dark Canvas
          'dark-card': '#0E2233',     // Deep Navy Card
          'dark-border': '#1F2D3D',   // Slate Grey Border
          'dark-hover': '#163248',    // Dark Hover
        },
        sidebar: {
          bg: '#0E2233',              // Deep Navy
          card: '#132B3E',
          hover: '#17344B',
          active: '#00BFA6',          // Teal Accent
          accent: '#00BFA6',
          text: '#9DB3C4',
          textActive: '#FFFFFF',
          border: '#1F2D3D',          // Slate Grey Border
        },
        'dark-bg': '#08141F',
        'dark-card': '#0E2233',
        'dark-border': '#1F2D3D',
        'dark-hover': '#163248',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(14, 34, 51, 0.03)',
        xs: '0 1px 2px 0 rgba(14, 34, 51, 0.04)',
        soft: '0 1px 3px 0 rgba(14, 34, 51, 0.05), 0 1px 2px -1px rgba(14, 34, 51, 0.04)',
        card: '0 1px 3px 0 rgba(14, 34, 51, 0.05), 0 1px 2px -1px rgba(14, 34, 51, 0.04)',
        'card-hover': '0 10px 20px -4px rgba(14, 34, 51, 0.08), 0 4px 6px -2px rgba(14, 34, 51, 0.03)',
        hover: '0 10px 20px -4px rgba(14, 34, 51, 0.08), 0 4px 6px -2px rgba(14, 34, 51, 0.03)',
        dropdown: '0 10px 25px -5px rgba(14, 34, 51, 0.12), 0 8px 10px -6px rgba(14, 34, 51, 0.06)',
        modal: '0 25px 50px -12px rgba(14, 34, 51, 0.35)',
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
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
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
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
