/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B7CF1',
        secondary: '#5BB8FF',
        accent: '#94C7FD',
        brand: {
          DEFAULT: '#3B7CF1',
          hover: '#1800AD',
        }
      },
    },
  },
  plugins: [],
}
