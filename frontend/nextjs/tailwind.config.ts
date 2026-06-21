import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '898px',
      // xl:"1024px"
    },
    container: {
      center: true,
    },
    extend: {
      animation: {
        'gradient-x': 'gradient-x 10s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'custom-gradient':
          'linear-gradient(150deg, #1B1B16 1.28%, #565646 90.75%)',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #9867F0, #ED4E50)',
        'indigo-gradient':
          'linear-gradient(135deg, #6366F1 0%, #5B5BFF 50%, #00D4FF 100%)',
        'neon-gradient': 'linear-gradient(135deg, #818CF8 0%, #00D4FF 100%)',
        // 保留以兼容旧组件引用，新代码请用 indigo-gradient
        'teal-gradient': 'linear-gradient(135deg, #0d9488, #0891b2, #2563eb)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(152, 103, 240, 0.5)',
        'glow-primary': '0 0 24px rgba(99, 102, 241, 0.45)',
        'glow-accent': '0 0 24px rgba(0, 212, 255, 0.35)',
        // 保留以兼容旧组件
        'teal-glow': '0 0 40px rgba(13, 148, 136, 0.5)',
      },
      colors: {
        // 主色：紫蓝（替换原 teal primary）
        primary: {
          DEFAULT: 'var(--primary)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary)',
          600: 'var(--primary-600)',
        },
        // 强调：青
        accent: {
          DEFAULT: 'var(--accent)',
          600: 'var(--accent-600)',
        },
        // 表面层（背景/面板/卡片）
        surface: {
          DEFAULT: 'var(--bg)',
          elevated: 'var(--bg-elevated)',
          panel: 'var(--panel)',
          card: 'var(--card)',
        },
        // 文字
        ink: {
          DEFAULT: 'var(--text)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--muted)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
    },
  },
  plugins: [],
};
export default config;
