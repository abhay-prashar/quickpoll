/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        // Brand orange — the single accent that replaces generic purple/indigo
        brand: {
          50:  '#fff5ed',
          100: '#ffe8d3',
          200: '#fecda6',
          300: '#fdaa6e',
          400: '#fb7a33',
          500: '#f95b0a',   // primary
          600: '#ea4003',
          700: '#c22d04',
          800: '#9a2609',
          900: '#7c230c',
        },
        // Neutral surface palette
        ink: {
          50:  '#f7f6f3',   // warm off-white — light bg
          100: '#eeecea',
          200: '#d9d7d3',
          300: '#b8b5b0',
          400: '#908d88',
          500: '#706d69',
          600: '#545250',
          700: '#3d3b39',
          800: '#252422',   // dark surface
          900: '#131210',
          950: '#0a0908',   // dark bg
        },
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fadeIn 0.25s ease-out forwards',
        'pop':        'pop 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'bar-grow':   'barGrow 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pop: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        barGrow: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.5' },
        },
      },
      boxShadow: {
        'brand': '0 0 0 3px rgba(249,91,10,0.25)',
        'card':  '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
