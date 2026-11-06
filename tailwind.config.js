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
        // Deep Emerald Palette (#123C35)
        emerald: {
          50: '#eef6f4',
          100: '#d8ebe6',
          200: '#b3d7cd',
          300: '#83bdb0',
          400: '#4f9d8d',
          500: '#297d6e',
          600: '#1b5d52',
          700: '#123C35', // Primary Deep Emerald
          800: '#0e2f29',
          900: '#0a221e',
          950: '#051411',
          DEFAULT: '#123C35',
        },
        brand: {
          50: '#eef6f4',
          100: '#d8ebe6',
          200: '#b3d7cd',
          300: '#83bdb0',
          400: '#4f9d8d',
          500: '#297d6e',
          600: '#123C35', // Deep Emerald Primary
          700: '#0e2f29', // Hover state
          800: '#0a221e', // Active state
          900: '#061815',
          950: '#030d0b',
          DEFAULT: '#123C35',
        },
        // Champagne Gold Palette (#C5A46D)
        gold: {
          50: '#fbf8f3',
          100: '#f5eee2',
          200: '#eadbc2',
          300: '#dec49c',
          400: '#d2ad77',
          500: '#C5A46D', // Secondary Champagne Gold
          600: '#aa8950',
          700: '#8b6d3d',
          800: '#6f5634',
          900: '#5a452c',
          DEFAULT: '#C5A46D',
        },
        champagne: {
          50: '#fbf8f3',
          100: '#f5eee2',
          200: '#eadbc2',
          300: '#dec49c',
          400: '#d2ad77',
          500: '#C5A46D', // Secondary Champagne Gold
          600: '#aa8950',
          700: '#8b6d3d',
          800: '#6f5634',
          900: '#5a452c',
          DEFAULT: '#C5A46D',
        },
        bronze: {
          50: '#fbf8f3',
          100: '#f5eee2',
          200: '#eadbc2',
          300: '#dec49c',
          400: '#d2ad77',
          500: '#C5A46D',
          600: '#aa8950',
          700: '#8b6d3d',
          800: '#6f5634',
          900: '#5a452c',
          DEFAULT: '#C5A46D',
        },
        amber: {
          50: '#fbf8f3',
          100: '#f5eee2',
          200: '#eadbc2',
          300: '#dec49c',
          400: '#d2ad77',
          500: '#C5A46D', // Harmonized to Champagne Gold
          600: '#aa8950',
          700: '#8b6d3d',
          800: '#6f5634',
          900: '#5a452c',
          DEFAULT: '#C5A46D',
        },
        // Warm Ivory Palette (#F7F4EC)
        ivory: {
          50: '#ffffff',
          100: '#fbfaf7',
          200: '#F7F4EC', // Main Background Warm Ivory
          300: '#ede8dc',
          400: '#ded5bf',
          500: '#c8bc9f',
          DEFAULT: '#F7F4EC',
        },
        // Charcoal Palette (#202A27 & #252923)
        charcoal: {
          600: '#384843',
          700: '#2e3b37',
          800: '#252923', // Primary Text Deep Charcoal
          900: '#202A27', // Dark Surface Charcoal
          950: '#141a18', // Dark Canvas
          DEFAULT: '#202A27',
        },
        // Muted Grey (#777D78)
        muted: {
          400: '#9ea5a1',
          500: '#777D78', // Secondary Text Muted Grey
          600: '#5c625d',
          DEFAULT: '#777D78',
        },
        // Soft Warm Grey Border (#E8E5DC)
        warmborder: {
          DEFAULT: '#E8E5DC',
        },
        surface: {
          canvas: '#F7F4EC',
          card: '#FFFFFF',
          border: '#E8E5DC',
          'dark-canvas': '#141a18',
          'dark-card': '#202A27',
          'dark-border': '#2e3b37',
          'dark-hover': '#26322f',
        },
        sidebar: {
          bg: '#202A27',
          card: '#26322f',
          hover: '#2e3b37',
          active: '#123C35',
          accent: '#C5A46D',
          text: '#9ea5a1',
          textActive: '#FFFFFF',
          border: '#2e3b37',
        },
        'dark-bg': '#141a18',
        'dark-card': '#202A27',
        'dark-border': '#2e3b37',
        'dark-hover': '#26322f',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(32, 42, 39, 0.03)',
        xs: '0 1px 2px 0 rgba(32, 42, 39, 0.04)',
        soft: '0 1px 3px 0 rgba(32, 42, 39, 0.05), 0 1px 2px -1px rgba(32, 42, 39, 0.04)',
        card: '0 1px 3px 0 rgba(32, 42, 39, 0.06), 0 1px 2px -1px rgba(32, 42, 39, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(18, 60, 53, 0.10), 0 4px 8px -2px rgba(18, 60, 53, 0.04)',
        hover: '0 12px 24px -6px rgba(18, 60, 53, 0.10), 0 4px 8px -2px rgba(18, 60, 53, 0.04)',
        dropdown: '0 10px 25px -5px rgba(18, 60, 53, 0.12), 0 8px 10px -6px rgba(18, 60, 53, 0.06)',
        modal: '0 25px 50px -12px rgba(18, 60, 53, 0.25)',
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
