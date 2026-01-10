import starlightPlugin from '@astrojs/starlight-tailwind';

// VibeKit Theme Colors - single source of truth
const theme = {
  // Primary accent - mint/teal green
  accent: {
    DEFAULT: '#5de4c7',
    light: '#7aead3',
    dark: '#4ac9ad',
  },
  // Background colors
  bg: {
    DEFAULT: '#121212',
    card: '#171717',
    elevated: '#1e1e1e',
  },
  // Border colors
  border: {
    DEFAULT: '#333',
    light: '#444',
  },
  // Text colors
  text: {
    DEFAULT: '#ffffff',
    muted: '#888',
    subtle: '#666',
  },
};

// Starlight requires specific color format
const accent = {
  200: theme.accent.light,
  600: theme.accent.DEFAULT,
  900: '#1a3a32',
  950: '#0f2520',
};

const gray = {
  100: '#e5e5e5',
  200: '#cccccc',
  300: '#999999',
  400: theme.text.muted,
  500: theme.text.subtle,
  700: theme.border.DEFAULT,
  800: theme.bg.card,
  900: theme.bg.DEFAULT,
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        accent,
        gray,
        // Semantic color aliases for easy use
        vk: theme,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [starlightPlugin()],
};
