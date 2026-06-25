/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          55: '#f5f7ff',
          550: '#5346e0',
          650: '#463cc9',
        },
        slate: {
          55: '#f8fafc',
          250: '#cbd5e1',
          355: '#94a3b8',
          455: '#64748b',
          655: '#475569',
          705: '#334155',
          750: '#1e293b',
          755: '#1e293b',
          850: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
