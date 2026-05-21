/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg-primary': 'var(--bg-primary)',
        'app-bg-secondary': 'var(--bg-secondary)',
        'app-bg-canvas': 'var(--bg-canvas)',
        'app-bg-sidebar': 'var(--bg-sidebar)',
        'app-bg-topbar': 'var(--bg-topbar)',
        'app-bg-card': 'var(--bg-card)',
        'app-bg-input': 'var(--bg-input)',
        'app-bg-hover': 'var(--bg-hover)',
        'app-text-main': 'var(--text-main)',
        'app-text-muted': 'var(--text-muted)',
        'app-text-dim': 'var(--text-dim)',
        'app-accent': 'var(--accent)',
        'app-accent-hover': 'var(--accent-hover)',
        'app-accent-light': 'var(--accent-light)',
        'app-border': 'var(--border)',
        'app-danger': 'var(--danger)',
        'app-danger-hover': 'var(--danger-hover)',
        'app-success': 'var(--success)',
        'app-warning': 'var(--warning)',
        'app-chart-1': 'var(--chart-1)',
        'app-chart-2': 'var(--chart-2)',
        'app-chart-3': 'var(--chart-3)',
        'app-chart-4': 'var(--chart-4)',
        'app-chart-5': 'var(--chart-5)',
        'app-chart-6': 'var(--chart-6)',
      },
    },
  },
  plugins: [],
};
