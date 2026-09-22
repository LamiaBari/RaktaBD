/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        sora:  ['Sora', 'sans-serif'],
      },
      colors: {
        teal:      { DEFAULT: '#5E7D7E', dark: '#3d5a5b', light: '#7a9a9b' },
        lavender:  { DEFAULT: '#E6E6FA', dark: '#c8c8e8', mid: '#d4d4f0' },
        fog:       '#e8eeee',
        mist:      '#f0f4f4',
        pearl:     '#f7f8fc',
        charcoal:  '#2c3e3f',
        midgray:   '#5a6b6c',
        softgray:  '#9aacad',
        urgent:    { DEFAULT: '#c0392b', soft: '#fdecea' },
        success:   { DEFAULT: '#2e7d5e', soft: '#e8f5ef' },
        warn:      { DEFAULT: '#7a6000', soft: '#fdf8e8' },
      },
    },
  },
  plugins: [],
}
