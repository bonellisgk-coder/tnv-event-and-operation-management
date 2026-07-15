/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#27AE60',   // Vibrant Emerald Green
          hover: '#229954',
          light: '#EAFAF1',     // Very soft green tint
          mid: '#A9DFBF',       // Muted medium green for borders
        },
        accent: {
          DEFAULT: '#F4C430',   // Saffron/Golden Yellow
          hover: '#E6B829',
          light: '#FEFDE7',     // Very soft yellow tint
        },
        background: {
          DEFAULT: '#F5FFF9',   // Barely-there green-white
          card: '#FFFFFF',
        },
        success: {
          DEFAULT: '#1E8449',
          light: '#D5F5E3',
        },
        danger: {
          DEFAULT: '#C0392B',
          light: '#FDEDEC',
        },
        gray: {
          dark: '#2C3E50',
          medium: '#7F8C8D',
          light: '#F4F6F7',
          border: '#E8F8F0',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'Work Sans', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 16px rgba(39, 174, 96, 0.08)',
        premium: '0 8px 32px rgba(39, 174, 96, 0.12)',
        card: '0 1px 4px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
