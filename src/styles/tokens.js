/**
 * Design Tokens
 * 颜色系统的唯一事实来源
 * 被 tailwind.config.js 和 业务代码(TS/JS) 共同引用
 */

// 默认品牌主色（用于初始化 CSS 变量与派生色）
export const DEFAULT_THEME_COLOR = '#749E68';

// 不随主题色变化的中性色与语义色
const baseNeutralColors = {
  surface: {
    // Light mode
    DEFAULT: '#ffffff',
    variant: '#f4f4f5', // Zinc 100
    onSurface: '#27272a', // Zinc 800
    onVariant: '#71717a', // Zinc 500

    // Dark mode
    dark: '#27272a', // Zinc 800
    variantDark: '#3f3f46', // Zinc 700 (用于输入框、次级容器等)
    onSurfaceDark: '#f4f4f5', // Zinc 100 (主要文字，确保高对比度)
    onVariantDark: '#a1a1aa', // Zinc 400 (次要文字)

    // 容器组件背景
    container: '#ffffff',
    containerDark: '#27272a',

    containerLow: '#f4f4f5',
    containerLowDark: '#27272a',

    containerHigh: '#ececee',
    containerHighDark: '#3f3f46', // Zinc 700 (用于浮动控件背景)

    containerHighest: '#e4e4e7',
    containerHighestDark: '#52525b', // Zinc 600 (用于Hover状态或高强调元素)
  },
  background: {
    DEFAULT: '#F0F2EB', // Soft muted beige/grey
    dark: '#18181b', // Zinc 950 (应用最底层背景)
  },
  border: {
    DEFAULT: '#e4e4e7', // Zinc 200
    dark: '#3f3f46', // Zinc 700
  },
  error: {
    DEFAULT: '#ef4444',
    container: '#fee2e2',
    containerDark: '#450a0a', // Darker red background for dark mode

    onContainer: '#991b1b',
    onContainerDark: '#fecaca',
  },
  // 文本颜色 (用于非 Tailwind 环境，如 Canvas/Monaco)
  text: {
    light: {
      primary: '#27272a', // Zinc 800
      secondary: '#71717a', // Zinc 500
      muted: '#a1a1aa', // Zinc 400
    },
    dark: {
      primary: '#f4f4f5', // Zinc 100
      secondary: '#a1a1aa', // Zinc 400
      muted: '#71717a', // Zinc 500
    },
  },
  // 滚动条颜色
  scrollbar: {
    thumb: '#d4d4d8', // Zinc 300
    thumbDark: '#52525b', // Zinc 600
    thumbHover: '#a1a1aa', // Zinc 400
  },
};

// 默认（静态）主色派生，用于运行时代码的初始值
const defaultPrimary = {
  DEFAULT: '#749E68', // Sage Green
  hover: '#638a58',
  container: '#e8f5e9',
  containerDark: '#1a3a0f',
  onPrimary: '#ffffff',
  onContainer: '#1a3a0f',
  onContainerDark: '#e8f5e9',
  selection: '#749e68b2', // Primary + 70% alpha
  editorBackground: '#00000000',
};

// 运行时（JS/TS）使用的颜色 —— 含默认主色，供画布/Monaco等场景使用
export const runtimeColors = {
  primary: defaultPrimary,
  ...baseNeutralColors,
};

// 保持向后兼容：原有的 colors 引用指向 runtimeColors
export const colors = runtimeColors;

// Tailwind 侧的颜色定义：主色依赖 CSS 变量，便于运行时覆盖
export const tailwindColors = {
  primary: {
    DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
    hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
    container: 'rgb(var(--color-primary-container) / <alpha-value>)',
    containerDark: 'rgb(var(--color-primary-container-dark) / <alpha-value>)',
    onPrimary: 'rgb(var(--color-on-primary) / <alpha-value>)',
    onContainer: 'rgb(var(--color-on-primary-container) / <alpha-value>)',
    onContainerDark: 'rgb(var(--color-on-primary-container-dark) / <alpha-value>)',
    selection: 'rgba(var(--color-primary-rgb), 0.7)',
    editorBackground: 'transparent',
  },
  ...baseNeutralColors,
};
