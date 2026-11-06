/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        panel: v('panel'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        accent: v('accent'),
        'accent-ink': v('accent-ink'),
        danger: v('danger'),
        warn: v('warn'),
        ok: v('ok'),
      },
      fontFamily: {
        sans: ['"Barlow"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
