/**
 * 主题色运行时工具
 * - 根据十六进制主色生成衍生色
 * - 将衍生色写入 CSS 变量，供 Tailwind 和运行时代码共享
 */

import { DEFAULT_THEME_COLOR, runtimeColors } from '@/styles/tokens';

const clamp = (value: number, min = 0, max = 255) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b]
    .map((c) => clamp(Math.round(c)).toString(16).padStart(2, '0'))
    .join('')}`;

const mix = (base: { r: number; g: number; b: number }, target: { r: number; g: number; b: number }, ratio: number) => ({
  r: clamp(base.r * (1 - ratio) + target.r * ratio),
  g: clamp(base.g * (1 - ratio) + target.g * ratio),
  b: clamp(base.b * (1 - ratio) + target.b * ratio),
});

const toRgbString = ({ r, g, b }: { r: number; g: number; b: number }) => `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;

const getLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const derivePalette = (primaryHex: string) => {
  let safeHex = primaryHex;
  if (!/^#?[0-9a-fA-F]{6}$/.test(primaryHex) && !/^#?[0-9a-fA-F]{3}$/.test(primaryHex)) {
    safeHex = DEFAULT_THEME_COLOR;
  }
  if (!safeHex.startsWith('#')) safeHex = `#${safeHex}`;

  const base = hexToRgb(safeHex);

  const hover = mix(base, { r: 0, g: 0, b: 0 }, 0.12); // 暗一些
  const container = mix(base, { r: 255, g: 255, b: 255 }, 0.82); // 更浅
  const containerDark = mix(base, { r: 0, g: 0, b: 0 }, 0.7); // 更深

  const onPrimary = getLuminance(base) > 0.55 ? { r: 28, g: 28, b: 28 } : { r: 255, g: 255, b: 255 };
  const onContainer = { r: 26, g: 58, b: 15 }; // 与默认保持一致的深色
  const onContainerDark = mix(onContainer, { r: 255, g: 255, b: 255 }, 0.75);

  return {
    hex: safeHex,
    primary: base,
    hover,
    container,
    containerDark,
    onPrimary,
    onContainer,
    onContainerDark,
    selection: `rgba(${toRgbString(base)}, 0.7)`,
  };
};

/**
 * 将派生色写入 CSS 变量
 */
export const applyThemeColor = (primaryHex: string) => {
  if (typeof document === 'undefined') return;

  const palette = derivePalette(primaryHex);
  const root = document.documentElement.style;

  root.setProperty('--color-primary', toRgbString(palette.primary));
  root.setProperty('--color-primary-hover', toRgbString(palette.hover));
  root.setProperty('--color-primary-container', toRgbString(palette.container));
  root.setProperty('--color-primary-container-dark', toRgbString(palette.containerDark));
  root.setProperty('--color-on-primary', toRgbString(palette.onPrimary));
  root.setProperty('--color-on-primary-container', toRgbString(palette.onContainer));
  root.setProperty('--color-on-primary-container-dark', toRgbString(palette.onContainerDark));
  root.setProperty('--color-primary-rgb', toRgbString(palette.primary));
  root.setProperty('--color-primary-hex', palette.hex);
  root.setProperty('--color-primary-selection', palette.selection);

  // 更新运行时 colors.primary（供非 Tailwind 场景使用）
  runtimeColors.primary = {
    DEFAULT: palette.hex,
    hover: rgbToHex(palette.hover),
    container: rgbToHex(palette.container),
    containerDark: rgbToHex(palette.containerDark),
    onPrimary: rgbToHex(palette.onPrimary),
    onContainer: rgbToHex(palette.onContainer),
    onContainerDark: rgbToHex(palette.onContainerDark),
    selection: palette.selection,
    editorBackground: runtimeColors.primary.editorBackground,
  };
};

/**
 * 读取当前 CSS 变量得到的主色（用于 Canvas/Monaco 等运行时场景）
 */
export const getRuntimePrimary = () => {
  if (typeof document === 'undefined') return runtimeColors.primary;
  const styles = getComputedStyle(document.documentElement);
  const toHexFromVar = (name: string) => {
    const value = styles.getPropertyValue(name).trim();
    if (!value) return runtimeColors.primary.DEFAULT;
    const [r, g, b] = value.split(/\s+/).map(Number);
    return rgbToHex({ r, g, b });
  };
  const selection = styles.getPropertyValue('--color-primary-selection')?.trim();

  return {
    DEFAULT: toHexFromVar('--color-primary'),
    hover: toHexFromVar('--color-primary-hover'),
    container: toHexFromVar('--color-primary-container'),
    containerDark: toHexFromVar('--color-primary-container-dark'),
    onPrimary: toHexFromVar('--color-on-primary'),
    onContainer: toHexFromVar('--color-on-primary-container'),
    onContainerDark: toHexFromVar('--color-on-primary-container-dark'),
    selection: selection || runtimeColors.primary.selection,
    editorBackground: runtimeColors.primary.editorBackground,
  };
};

export const themeColorUtils = {
  applyThemeColor,
  getRuntimePrimary,
  derivePalette,
};

export default themeColorUtils;
