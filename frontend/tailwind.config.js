/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bisa-blue': '#004a99', // Color institucional para cumplimiento de objetivos [cite: 40, 58]
            },
        },
    },
    plugins: [],
}