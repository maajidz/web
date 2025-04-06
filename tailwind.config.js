/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        logo: ['Pacifico', 'cursive'],
      },
      // You might not need these if the theme provides similar colors
      // colors: {
      //   primary: '#6366F1', // Keep this if you want the exact hex
      //   secondary: '#3B82F6', // Keep this if you want the exact hex
      // },
      borderRadius: {
        button: '12px', // Example of adding a custom radius
      },
    },
  },
  // plugins array and daisyui block are removed for Tailwind v4 / DaisyUI v5
  // plugins: [
  //   require('daisyui'),
  // ],
  // daisyui: { ... },
}

