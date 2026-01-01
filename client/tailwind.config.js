/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1c1917', // Stone 900
        surface: '#292524',    // Stone 800
        primary: '#d6d3d1',    // Stone 300
        secondary: '#a8a29e',  // Stone 400
        accent: '#f59e0b',     // Amber 500
      }
    },
  },
  plugins: [],
}