/** @type {import('tailwindcss').Config} */
export default {
  // 1. Habilitamos el modo oscuro basado en una clase en el HTML
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 2. Ahora los colores de Tailwind apuntan a nuestras variables CSS
      colors: {
        'primary-bg': 'var(--color-primary-bg)',
        'secondary-bg': 'var(--color-secondary-bg)',
        'primary-accent': 'var(--color-primary-accent)',
        'secondary-accent': 'var(--color-secondary-accent)',
        'primary-text': 'var(--color-primary-text)',
        'secondary-text': 'var(--color-secondary-text)',
      }
    },
  },
  plugins: [],
}