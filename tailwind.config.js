/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-low": "#f5f5dc",
        "inverse-primary": "#eebba6",
        "primary-fixed": "#ffdbcc",
        "secondary-container": "#b6ebd8",
        "inverse-on-surface": "#f2f2d9",
        "surface": "#fbfbe2",
        "on-secondary-container": "#3a6c5d",
        "on-primary": "#ffffff",
        "on-error-container": "#93000a",
        "error": "#ba1a1a",
        "primary-fixed-dim": "#eebba6",
        "on-tertiary": "#ffffff",
        "primary-container": "#ffcbb5",
        "on-error": "#ffffff",
        "outline": "#83746e",
        "surface-bright": "#fbfbe2",
        "secondary-fixed": "#b9eedb",
        "on-secondary-fixed": "#002018",
        "background": "#fbfbe2",
        "on-tertiary-fixed-variant": "#4f4257",
        "surface-container-high": "#eaead1",
        "on-primary-fixed-variant": "#613e2e",
        "tertiary-fixed-dim": "#d3c0db",
        "on-background": "#1b1d0e",
        "surface-container": "#efefd7",
        "surface-container-lowest": "#ffffff",
        "outline-variant": "#d5c3bc",
        "inverse-surface": "#303221",
        "surface-tint": "#7c5544",
        "on-surface": "#1b1d0e",
        "tertiary-fixed": "#efdcf7",
        "on-secondary": "#ffffff",
        "surface-variant": "#e4e4cc",
        "surface-container-highest": "#e4e4cc",
        "on-tertiary-container": "#66586e",
        "on-primary-fixed": "#2f1407",
        "on-secondary-fixed-variant": "#1c4f41",
        "error-container": "#ffdad6",
        "secondary": "#366758",
        "on-tertiary-fixed": "#22172a",
        "on-surface-variant": "#51443f",
        "tertiary": "#685970",
        "surface-dim": "#dbdcc3",
        "secondary-fixed-dim": "#9dd1bf",
        "tertiary-container": "#e3d0eb",
        "primary": "#7c5544",
        "on-primary-container": "#7a5442"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
        "2xl": "1.5rem"
      },
      spacing: {
        unit: "4px",
        "stack-sm": "8px",
        "section-gap": "48px",
        "stack-lg": "32px",
        gutter: "16px",
        "stack-md": "16px",
        "container-margin": "24px"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "display": ["Montserrat", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Montserrat", "sans-serif"],
        "label-lg": ["Inter", "sans-serif"],
        "headline-md": ["Montserrat", "sans-serif"],
        "body": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
}