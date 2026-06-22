import ColorPalette from './colors';

export const theme = {
  colors: {
    primary: ColorPalette.primary,
    strongPrimary: ColorPalette.strongPrimary,
    secondary: '#ffffff',
    accent: '#1a73e8', // Blue color used for synchronous runs
    background: '#f5f5f5',
    cardBackground: '#ffffff',
    placeholderBackground: '#eaeaea',
    border: '#ccc',
    lightBorder: '#e9ecef',
    errorBackground: '#ffe3e3',
    errorText: '#d63031',
    textPrimary: '#ffffff',
    textSecondary: '#000000',
    textMuted: '#666666',
    textPlaceholder: '#868e96',
  },
  radius: {
    small: 8,
    medium: 12,
    large: 16,
  },
  spacing: {
    small: 8,
    medium: 12,
    large: 16,
  },
  typography: {
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 14,
      color: '#333333',
    },
  },
};
