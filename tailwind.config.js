/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F7F4EC',
        surface: '#FFFFFF',
        ink: '#1C1B17',
        inksoft: '#5B564A',
        primary: '#0F4C3A',
        primarydark: '#0A3527',
        primarysoft: '#E4EEE8',
        gold: '#C9A227',
        goldsoft: '#F3E8C7',
        danger: '#B33A3A',
        dangersoft: '#F6E4E1',
        line: '#E4DFD0'
      },
      fontFamily: {
        heading: ['Cairo', 'sans-serif'],
        body: ['Tajawal', 'sans-serif']
      }
    }
  },
  plugins: []
};
