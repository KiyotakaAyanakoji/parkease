export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#10241B',
        primary: '#249F68',
        bright: '#32B978',
        offwhite: '#F7F8F3',
        surface: '#EEF2EC',
        muted: '#6B786F',
        mint: '#E4F2E9',
        sage: '#D0E0D6',
        charcoal: '#2C3E35',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
