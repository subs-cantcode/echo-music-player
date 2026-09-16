/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F1',
        panel: '#EFE9DE',
        border: '#DDD4C4',
        'text-primary': '#4A443A',
        'text-secondary': '#8C8272',
        accent: '#B5623E',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        'player': '640px',
      },
    },
  },
  plugins: [],
}
