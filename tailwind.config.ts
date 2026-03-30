import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f6f4',
        ink: '#111111',
        muted: '#666666',
        border: '#dfdfda'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 18px 36px -28px rgba(17, 17, 17, 0.2)'
      }
    }
  },
  plugins: []
};

export default config;
