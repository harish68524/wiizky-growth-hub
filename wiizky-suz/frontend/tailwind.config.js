/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'charcoal': '#121212',
        'soft-white': '#f8f9fa',
        'neon-purple': '#b026ff',
        'neon-blue': '#00d2ff',
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to right, #b026ff, #00d2ff)',
      }
    },
  },
  plugins: [],
}