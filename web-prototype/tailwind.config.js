/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          300: '#A5B4FC',
          500: '#4F46E5',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#312E81',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        bordergray: '#E5E7EB',
        textprimary: '#111827',
        textsecondary: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        btn: '10px',
        card: '16px',
        modal: '20px',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79,70,229,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(79,70,229,0)' },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(12deg)' },
          '40%': { transform: 'rotate(-10deg)' },
          '60%': { transform: 'rotate(6deg)' },
          '80%': { transform: 'rotate(-4deg)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 1.8s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}
