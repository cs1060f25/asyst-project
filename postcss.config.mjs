// When running tests (Vitest), avoid loading Tailwind/LightningCSS.
// Vitest sets process.env.VITEST. We export an empty plugin list in that case
// to prevent Vite from attempting to load PostCSS/Tailwind during tests.
const isVitest = !!process.env.VITEST;

const config = {
  // Next.js requires plugin names as strings.
  plugins: isVitest ? [] : ["@tailwindcss/postcss"],
};

export default config;
