/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./src/client/**/*.{js,ts,jsx,tsx,html}",
    "./src/client/index.html",
    "./index.html",
  ],
  theme: {
    extend: {
      keyframes: {
        'ripple-expand': {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '1' },
          '70%': { opacity: '0.6' },
          '100%': { transform: 'translate(-50%, -50%) scale(3)', opacity: '0' },
        },
        'ripple-expand-delayed': {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(2)', opacity: '0' },
        },
        'center-pulse': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: '0.8' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0' },
        },
        'pulse-expand': {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '1' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'translate(-50%, -50%) scale(2.5)', opacity: '0' },
        },
        'glow-pulse': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
          '25%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: '0.9' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: '0.7' },
          '75%': { transform: 'translate(-50%, -50%) scale(0.9)', opacity: '0.5' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0' },
        },
        'hotspot-liquid-splash': {
          '0%': { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'translate(-50%, -50%) scale(1.2) rotate(180deg)', opacity: '0.8' },
          '100%': { transform: 'translate(-50%, -50%) scale(2) rotate(360deg)', opacity: '0' },
        },
        'droplet': {
          '0%': { transform: 'translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(0) scale(1)', opacity: '1' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(-40px) scale(0)', opacity: '0' },
        },
        'hotspot-liquid-core': {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '1' },
          '30%': { transform: 'translate(-50%, -50%) scale(1.1)', opacity: '0.9' },
          '60%': { transform: 'translate(-50%, -50%) scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: '0' },
        },
        'text-tip-liquid-border': {
          '0%, 100%': { transform: 'rotate(0deg)', opacity: '0.6' },
          '50%': { transform: 'rotate(180deg)', opacity: '1' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'ripple-expand': 'ripple-expand 0.5s ease-out forwards',
        'ripple-expand-delayed': 'ripple-expand-delayed 0.5s ease-out forwards',
        'center-pulse': 'center-pulse 0.5s ease-out forwards',
        'pulse-expand': 'pulse-expand 0.6s ease-out forwards',
        'glow-pulse': 'glow-pulse 0.6s ease-out forwards',
        'liquid-splash': 'hotspot-liquid-splash 0.8s ease-out forwards',
        'droplet': 'droplet 0.8s ease-out forwards',
        'liquid-core': 'hotspot-liquid-core 0.8s ease-out forwards',
        'text-tip-liquid-border': 'textTipLiquidBorder 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}