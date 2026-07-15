/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — Dark Teal
        primary: {
          DEFAULT: '#224F44',
          light: '#2D6658',
          dark: '#1B4036',
          50: '#F4F8F5',
        },
        bg: {
          DEFAULT: '#F3F4F8',
          dark: '#E8E9ED',
        },
        card: '#FFFFFF',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        success: { DEFAULT: '#B9EBC6', dark: '#2F9E44', light: '#CFF4D2' },
        warning: { DEFAULT: '#D6E4FF', dark: '#3B5BDB' },
        danger: { DEFAULT: '#FEE2E2', dark: '#DC2626' },
        border: '#E5E7EB',
        'auth-teal': { DEFAULT: '#224F44', light: '#2D6658', dark: '#1B4036' },
        'input-bg': '#F4F8F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        button: '999px',
        pill: '999px',
        xl: '20px',
        '2xl': '30px',
      },
      boxShadow: {
        card: '0 10px 30px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
