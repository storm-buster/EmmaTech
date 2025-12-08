export const theme = {
  colors: {
    primary: {
      main: '#E2E8F0', // Platinum
      dark: '#94A3B8',
      light: '#F8FAFC',
      glow: 'rgba(226, 232, 240, 0.1)',
    },
    secondary: {
      main: '#64748B', // Slate
      dark: '#334155',
      light: '#94A3B8',
    },
    background: {
      primary: '#0F1115', // Rich Charcoal
      secondary: '#15181E',
      tertiary: '#1E2229',
      card: 'rgba(21, 24, 30, 0.6)',
    },
    neutral: {
      darkGray: '#0F1115',
      mediumGray: '#94A3B8',
      lightGray: '#CBD5E1',
      white: '#F8FAFC',
      border: 'rgba(226, 232, 240, 0.08)',
    },
    semantic: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
    accent: {
      blue: '#E2E8F0', // Muted to Platinum
      purple: '#E2E8F0', // Muted
      pink: '#E2E8F0', // Muted
      green: '#10B981',
    },
  },
  typography: {
    fontFamily: {
      primary: "'Inter', system-ui, -apple-system, sans-serif",
      monospace: "'JetBrains Mono', 'Fira Code', monospace",
      display: "'Playfair Display', serif",
    },
    fontSize: {
      h1Desktop: '72px',
      h1Mobile: '48px',
      h2Desktop: '56px',
      h2Mobile: '36px',
      h3: '32px',
      bodyLarge: '20px',
      body: '16px',
      small: '14px',
    },
    lineHeight: {
      h1Desktop: '1.1',
      h1Mobile: '1.2',
      h2Desktop: '1.2',
      h2Mobile: '1.3',
      h3: '1.3',
      bodyLarge: '1.6',
      body: '1.6',
      small: '1.5',
    },
    fontWeight: {
      regular: 400,
      semibold: 500, // Lighter weights for elegance
      bold: 600,
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
    card: '0 4px 24px rgba(0, 0, 0, 0.2)',
    cardHover: '0 8px 32px rgba(0, 0, 0, 0.3)',
    glow: 'none',
    glowLarge: 'none',
    inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)', // Platinum gradient
    secondary: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
    dark: 'linear-gradient(180deg, #0F1115 0%, #15181E 100%)',
    card: 'linear-gradient(135deg, rgba(21, 24, 30, 0.8) 0%, rgba(15, 17, 21, 0.8) 100%)',
    mesh: 'radial-gradient(circle at 50% 50%, rgba(226, 232, 240, 0.03) 0%, transparent 60%)',
  },
  borderRadius: {
    small: '0px', // Sharp corners for architectural feel
    medium: '0px',
    large: '0px',
  },
  transitions: {
    default: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', // Slower, smoother
  },
};

export type Theme = typeof theme;
