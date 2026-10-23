/**
 * Yol Ma'lumoti — Unified Design Tokens
 * Strictly adheres to Part 4.2 design token specification.
 */

export const DESIGN_TOKENS = {
  colors: {
    // Light Mode (Default)
    outerBg: '#E7E4EA',
    appPanel: '#F2EFF5',
    card: '#FFFFFF',
    innerSoftArea: '#F2EFF5',
    border: '#E7E4EA',
    toggleOff: '#D9D6DD',
    
    // Brand & Buttons
    accentOrange: '#E8593A',
    orangeTint: '#FDE6DF',
    blackPill: '#151218',
    blackPillHover: '#2A2430',
    
    // Typography
    textPrimary: '#151218',
    textSecondary: '#55505A',
    
    // Status colors
    success: {
      text: '#1F7A4D',
      bg: '#E3F4EA',
      border: '#C3E6D0'
    },
    warning: {
      text: '#9A5B00',
      bg: '#FFF1D6',
      border: '#FFE3AC'
    },
    danger: {
      text: '#B42318',
      bg: '#FDE8E6',
      border: '#F8C8C4'
    },
    info: {
      text: '#175CD3',
      bg: '#EFF8FF',
      border: '#B2DDFF'
    },

    // Dark Mode
    dark: {
      outerBg: '#0E0C10',
      appPanel: '#151218',
      card: '#1C191F',
      innerSoftArea: '#25212A',
      border: '#2C2833',
      textPrimary: '#FFFFFF',
      textSecondary: '#A59FA9',
      blackPill: '#FFFFFF',
      blackPillText: '#151218'
    },

    // High Contrast Mode
    highContrast: {
      bg: '#000000',
      card: '#000000',
      border: '#FFFFFF',
      text: '#FFFFFF',
      focusOutline: '#FFD700',
      buttonBg: '#FFFFFF',
      buttonText: '#000000'
    }
  },

  radii: {
    appPanel: '32px',
    card: '24px',
    inner: '16px',
    pill: '9999px',
    button: '9999px',
    iconCircle: '50%'
  },

  sizing: {
    minTouchTarget: '56px',
    dockWidthDesktop: '72px',
    sidePanelWidthDesktop: '420px',
    topBarHeight: '76px'
  },

  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    titleMain: '36px',
    cardTitle: '24px',
    bodyMin: '18px',
    labelMin: '16px'
  }
} as const;

export type ThemeMode = 'light' | 'dark' | 'high-contrast';
