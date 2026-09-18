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
        // Channel-based so utilities can take opacity modifiers (bg-fg/85).
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-hover': 'rgb(var(--surface-hover-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        // Already tinted too (<alpha-value> = 1 would make it fully opaque).
        'border-subtle': 'var(--border-subtle)',
        fg: 'rgb(var(--fg-rgb) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted-rgb) / <alpha-value>)',
        'fg-faint': 'rgb(var(--fg-faint-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        // Accent for text/icons (darker in the light theme), and the ink used on
        // top of accent fills.
        'accent-text': 'rgb(var(--accent-text-rgb) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink-rgb) / <alpha-value>)',
        // Already a tinted colour: the alpha lives in the token itself.
        'accent-soft': 'var(--accent-soft)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
