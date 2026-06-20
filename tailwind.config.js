/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/views/**/*.{js,ts,jsx,tsx}',
    './src/@core/**/*.{js,ts,jsx,tsx}',
    './src/@layouts/**/*.{js,ts,jsx,tsx}',
    './src/@menu/**/*.{js,ts,jsx,tsx}',
    './src/assets/**/*.css'
  ],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [require('tailwindcss-logical'), require('./src/@core/tailwind/plugin')],
  theme: {
    extend: {}
  }
}
