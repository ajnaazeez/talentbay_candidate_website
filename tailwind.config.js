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
        // Midnight Navy + Electric Teal + Ice White + Mist Blue + Slate Ink + Cool Border
        midnight: {
          DEFAULT: '#142B3B',
          50: '#F0F6FA',
          100: '#E0EDF5',
          200: '#C2DCED',
          300: '#94C0DE',
          400: '#5F9EC9',
          500: '#387EB2',
          600: '#266494',
          700: '#1D4D73',
          800: '#183C59',
          900: '#142B3B', // Midnight Navy Primary Brand
          950: '#0C1B26',
        },
        teal: {
          DEFAULT: '#16B8A6',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#16B8A6', // Electric Teal Primary Accent & Action
          600: '#0D9488', // Hover state
          700: '#0F766E', // Active state
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        ice: {
          DEFAULT: '#F5F8FA', // Ice White Main Canvas
          50: '#FFFFFF',
          100: '#FAFBFD',
          200: '#F5F8FA',
          300: '#EDF2F6',
          400: '#E2EAF0',
          500: '#D5E1E8',
        },
        mist: {
          DEFAULT: '#E7EFF3', // Mist Blue Secondary Surface
          50: '#F7FAFC',
          100: '#F1F6F9',
          200: '#E7EFF3',
          300: '#D5E3EB',
          400: '#BCCFE0',
          500: '#9DB8CF',
        },
        ink: {
          DEFAULT: '#243746', // Slate Ink Headings & Body Text
          50: '#F3F6F8',
          100: '#E4ECF0',
          200: '#CBD9E2',
          300: '#A6BDCE',
          400: '#7B9CB6',
          500: '#597D9B',
          600: '#43627D',
          700: '#344C62',
          800: '#2B3F50',
          900: '#243746', // Slate Ink
          950: '#16222C',
        },
        coolborder: {
          DEFAULT: '#DCE5EB', // Cool Border
          light: '#EBF1F5',
          dark: '#243746',
        },
        // Brand is mapped to Electric Teal (#16B8A6) for primary CTAs & active accents
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#16B8A6', // Electric Teal Primary
          600: '#0D9488', // Hover
          700: '#0F766E', // Active
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        surface: {
          canvas: '#F5F8FA',          // Ice White
          card: '#FFFFFF',            // Pure White
          'dark-canvas': '#0F1D27',   // Dark Canvas
          'dark-card': '#142B3B',     // Midnight Navy Card
          'dark-border': '#243746',   // Dark Border
          'dark-hover': '#1B364A',    // Dark Hover
        },
        sidebar: {
          bg: '#142B3B',              // Midnight Navy
          card: '#1B364A',
          hover: '#1F3F56',
          active: '#16B8A6',          // Electric Teal
          accent: '#16B8A6',
          text: '#BACDD8',
          textActive: '#FFFFFF',
          border: '#243746',          // Dark Border
        },
        'dark-bg': '#0F1D27',
        'dark-card': '#142B3B',
        'dark-border': '#243746',
        'dark-hover': '#1B364A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(20, 43, 59, 0.03)',
        xs: '0 1px 2px 0 rgba(20, 43, 59, 0.04)',
        soft: '0 1px 3px 0 rgba(20, 43, 59, 0.05), 0 1px 2px -1px rgba(20, 43, 59, 0.04)',
        card: '0 1px 3px 0 rgba(20, 43, 59, 0.05), 0 1px 2px -1px rgba(20, 43, 59, 0.04)',
        'card-hover': '0 10px 20px -4px rgba(20, 43, 59, 0.08), 0 4px 6px -2px rgba(20, 43, 59, 0.03)',
        hover: '0 10px 20px -4px rgba(20, 43, 59, 0.08), 0 4px 6px -2px rgba(20, 43, 59, 0.03)',
        dropdown: '0 10px 25px -5px rgba(20, 43, 59, 0.12), 0 8px 10px -6px rgba(20, 43, 59, 0.06)',
        modal: '0 25px 50px -12px rgba(20, 43, 59, 0.35)',
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
