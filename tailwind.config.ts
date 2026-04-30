import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#101417',
        panel: '#171d21',
        panelMuted: '#20272d',
        borderSoft: '#334049',
        accent: '#4fb3a3',
        amber: '#d5a84f',
        danger: '#e06c75',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
