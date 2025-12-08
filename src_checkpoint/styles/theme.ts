export const theme = {
  colors: {
    primary: {
      main: '#00F0FF', // Cyan neon
      dark: '#00B8D4',
      light: '#4DFFFF',
      glow: 'rgba(0, 240, 255, 0.5)',
    },
    secondary: {
      main: '#7B2FFF', // Purple accent
      dark: '#5A1FCC',
      light: '#9D5FFF',
    },
    background: {
      primary: '#0A0E27', // Deep navy
      secondary: '#131829',
      tertiary: '#1A1F3A',
      card: 'rgba(26, 31, 58, 0.6)',
    },
    neutral: {
      darkGray: '#0A0E27',
      mediumGray: '#8B92B0',
      lightGray: '#C5CAE0',
      white: '#FFFFFF',
      border: 'rgba(139, 146, 176, 0.2)',
    },
    semantic: {
      success: '#00F5A0',
      error: '#FF3366',
      warning: '#FFB800',
    },
    accent: {
      blue: '#00D9FF',
      purple: '#B24BF3',
      pink: '#FF2E97',
      green: '#00F5A0',
    },
  },
  typography: {
    fontFamily: {
      primary: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
      monospace: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      display: "'Orbitron', 'Space Grotesk', sans-serif",
    },
    fontSize: {
      h1Desktop: '48px',
      h1Mobile: '32px',
      h2Desktop: '36px',
      h2Mobile: '28px',
      h3: '24px',
      bodyLarge: '18px',
      body: '16px',
      small: '14px',
    },
    lineHeight: {
      h1Desktop: '56px',
      h1Mobile: '40px',
      h2Desktop: '44px',
      h2Mobile: '36px',
      h3: '32px',
      bodyLarge: '28px',
      body: '24px',
      small: '20px',
    },
    fontWeight: {
      regular: 400,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
  shadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.4)',
    cardHover: '0 12px 48px rgba(0, 240, 255, 0.2)',
    glow: '0 0 20px rgba(0, 240, 255, 0.4)',
    glowLarge: '0 0 40px rgba(0, 240, 255, 0.3)',
    inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #00F0FF 0%, #7B2FFF 100%)',
    secondary: 'linear-gradient(135deg, #7B2FFF 0%, #FF2E97 100%)',
    dark: 'linear-gradient(180deg, #0A0E27 0%, #131829 100%)',
    card: 'linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(19, 24, 41, 0.6) 100%)',
    mesh: 'radial-gradient(circle at 20% 50%, rgba(123, 47, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.15) 0%, transparent 50%)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  transitions: {
    default: 'all 0.2s ease',
  },
};

export type Theme = typeof theme;
