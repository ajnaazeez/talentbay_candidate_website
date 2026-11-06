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
        // Midnight Charcoal + Burnt Copper + Porcelain Palette
        charcoal: {
          DEFAULT: '#29272A',
          50: '#F5F1EA',
          100: '#E6DFD8',
          200: '#C7BFB9',
          300: '#9E9493',
          400: '#736B70',
          500: '#494448', // Soft Graphite
          600: '#383439',
          700: '#29272A', // Midnight Charcoal
          800: '#222023',
          900: '#1A181B',
          950: '#121113',
        },
        copper: {
          DEFAULT: '#B87355',
          50: '#FAF4F0',
          100: '#F4E5DE',
          200: '#E6C5B5',
          300: '#D7A38C',
          400: '#C78469',
          500: '#B87355', // Burnt Copper
          600: '#A46347',
          700: '#8D5239',
          800: '#73412B',
          900: '#5C3322',
          950: '#3D2014',
        },
        porcelain: {
          DEFAULT: '#F5F1EA',
          50: '#FAF8F5',
          100: '#F5F1EA',
          200: '#E6DFD8',
          300: '#D7CDC4',
          400: '#C4B7AC',
          500: '#A8998C',
        },
        graphite: {
          DEFAULT: '#494448', // Soft Graphite
          light: '#736B70',
          dark: '#383439',
        },
        softborder: {
          DEFAULT: '#E6DFD8', // Soft Border
          dark: '#494448',
        },
        // Brand is mapped to Burnt Copper for primary actions & accents
        brand: {
          50: '#FAF4F0',
          100: '#F4E5DE',
          200: '#E6C5B5',
          300: '#D7A38C',
          400: '#C78469',
          500: '#B87355', // Burnt Copper Primary
          600: '#A46347', // Hover state
          700: '#8D5239', // Active state
          800: '#73412B',
          900: '#5C3322',
          950: '#3D2014',
        },
        surface: {
          canvas: '#F5F1EA',          // Porcelain
          card: '#FFFFFF',            // Pure White
          'dark-canvas': '#29272A',   // Midnight Charcoal
          'dark-card': '#222023',     // Dark card surface
          'dark-border': '#494448',   // Soft Graphite
          'dark-hover': '#383439',    // Dark hover surface
        },
        sidebar: {
          bg: '#29272A',              // Midnight Charcoal
          card: '#222023',
          hover: '#383439',
          active: '#B87355',          // Burnt Copper
          accent: '#B87355',
          text: '#D4CDC7',
          textActive: '#FFFFFF',
          border: '#494448',          // Soft Graphite
        },
        'dark-bg': '#29272A',
        'dark-card': '#222023',
        'dark-border': '#494448',
        'dark-hover': '#383439',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(41, 39, 42, 0.03)',
        xs: '0 1px 2px 0 rgba(41, 39, 42, 0.04)',
        soft: '0 1px 3px 0 rgba(41, 39, 42, 0.05), 0 1px 2px -1px rgba(41, 39, 42, 0.04)',
        card: '0 1px 3px 0 rgba(41, 39, 42, 0.05), 0 1px 2px -1px rgba(41, 39, 42, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(41, 39, 42, 0.09), 0 4px 8px -2px rgba(41, 39, 42, 0.04)',
        hover: '0 12px 24px -6px rgba(41, 39, 42, 0.09), 0 4px 8px -2px rgba(41, 39, 42, 0.04)',
        dropdown: '0 10px 25px -5px rgba(41, 39, 42, 0.12), 0 8px 10px -6px rgba(41, 39, 42, 0.06)',
        modal: '0 25px 50px -12px rgba(41, 39, 42, 0.35)',
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
