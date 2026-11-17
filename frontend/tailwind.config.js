/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FAFAFA',
          dark: '#0C0D0E'
        },
        panel: {
          light: '#FFFFFF',
          dark: '#141619'
        },
        subtle: {
          light: '#F4F4F5',
          dark: '#1C1F24'
        },
        line: {
          light: '#E4E4E7',
          dark: '#272A30'
        },
        primary: {
          light: '#18181B',
          dark: '#F4F4F5'
        },
        secondary: {
          light: '#71717A',
          dark: '#8E94A0'
        },
        tertiary: {
          light: '#A1A1AA',
          dark: '#5C6270'
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          subtle: '#EEF2FF',
          darkSubtle: '#1E293B'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'panel': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
};
