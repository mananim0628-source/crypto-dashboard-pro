/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'crypto-dark': '#0a0a0f',
        'crypto-dark-2': '#1a1a2e',
        'crypto-green': '#00ff88',
        'crypto-blue': '#48cae4',
        'crypto-red': '#ff4757',
        'crypto-yellow': '#feca57',
      },
      backgroundImage: {
        'gradient-crypto': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      },
    },
  },
  plugins: [],
}
